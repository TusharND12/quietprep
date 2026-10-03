import json
import threading
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.request import ProxyHandler, Request, build_opener

import server


VALID = {"role": "Junior developer", "focus": "behavioral", "context": ""}


class ValidationTests(unittest.TestCase):
    def test_private_model_addresses_only(self):
        for address in ["http://example.com", "https://127.0.0.1", "http://10.0.0.1", "http://localhost", "http://127.0.0.1/api", "http://user@127.0.0.1", "http://127.0.0.1?api=cloud"]:
            with self.subTest(address=address), self.assertRaises(ValueError):
                server.local_url(address)
        self.assertEqual(server.local_url("http://127.0.0.1:8091"), "http://127.0.0.1:8091")

    def test_bad_focus_is_a_validation_error(self):
        for focus in [[], {}, None, "unknown"]:
            with self.subTest(focus=focus), self.assertRaises(server.AppError):
                server.profile({**VALID, "focus": focus})

    def test_model_invented_quote_is_rejected(self):
        answer = "I compared two page layouts with my team before choosing one."
        result = {key: "A short coaching note" for key in server.REVIEW_SCHEMA["required"]}
        result["evidence"] = "I improved conversions by 40%."
        with patch.object(server, "infer", return_value=result), self.assertRaises(server.AppError) as error:
            server.review_answer({**VALID, "question": "Tell me about teamwork.", "answer": answer})
        self.assertEqual(error.exception.status, 502)

    def test_quote_from_the_answer_is_accepted(self):
        answer = "I compared two page layouts with my team before choosing one."
        result = {key: "A short coaching note" for key in server.REVIEW_SCHEMA["required"]}
        result["evidence"] = "I compared two page layouts"
        with patch.object(server, "infer", return_value=result):
            actual = server.review_answer({**VALID, "question": "Tell me about teamwork.", "answer": answer})
        self.assertIn(actual["evidence"], answer)

    def test_malformed_model_output_is_reported(self):
        for content in ["not json", "[]", '{"question":1}', '{"question":""}']:
            with self.subTest(content=content), patch.object(server, "BACKEND", "ollama"), patch.object(server, "local_request", return_value={"message": {"content": content}}), self.assertRaises(server.AppError) as error:
                server.make_question(VALID)
            self.assertEqual(error.exception.status, 502)
        self.assertTrue(server.INFERENCE_LOCK.acquire(blocking=False))
        server.INFERENCE_LOCK.release()

    def test_busy_model_does_not_accept_a_second_request(self):
        server.INFERENCE_LOCK.acquire()
        try:
            with self.assertRaises(server.AppError) as error:
                server.make_question(VALID)
            self.assertEqual(error.exception.status, 429)
        finally:
            server.INFERENCE_LOCK.release()

    def test_previous_questions_are_bounded(self):
        with self.assertRaises(server.AppError):
            server.make_question({**VALID, "previous": ["question"] * 9})


class HTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.http = server.ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        cls.thread = threading.Thread(target=cls.http.serve_forever, daemon=True)
        cls.thread.start()
        cls.base = f"http://127.0.0.1:{cls.http.server_port}"
        cls.opener = build_opener(ProxyHandler({}))

    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown()
        cls.http.server_close()
        cls.thread.join()

    def call(self, path, body=None, headers=None):
        request = Request(self.base + path, data=body, headers=headers or {})
        try:
            with self.opener.open(request) as response:
                return response.status, response.headers, response.read()
        except HTTPError as error:
            with error:
                return error.code, error.headers, error.read()

    def test_cross_site_post_is_rejected_before_inference(self):
        with patch.object(server, "make_question") as model:
            status, _, _ = self.call("/api/question", b"{}", {"Content-Type": "application/json", "Origin": "https://evil.example"})
            self.assertEqual(status, 403)
            model.assert_not_called()

    def test_dns_rebinding_host_is_rejected(self):
        status, _, _ = self.call("/api/status", headers={"Host": "evil.example"})
        self.assertEqual(status, 403)

    def test_plain_form_posts_are_rejected(self):
        status, _, _ = self.call("/api/question", b"role=developer", {"Content-Type": "text/plain"})
        self.assertEqual(status, 415)

    def test_request_limits_and_bad_json(self):
        for content, expected in [(b"x" * 32001, 413), (b"{", 400), (b"[]", 400), (b"null", 400)]:
            with self.subTest(expected=expected):
                status, _, _ = self.call("/api/question", content, {"Content-Type": "application/json"})
                self.assertEqual(status, expected)

    def test_generated_response_not_cached(self):
        result = {"question": "Tell me about a project.", "why_this": "Explain decisions.", "starter": "Name the problem."}
        with patch.object(server, "make_question", return_value=result):
            status, headers, raw = self.call("/api/question", json.dumps(VALID).encode(), {"Content-Type": "application/json", "Origin": self.base})
        self.assertEqual(status, 200)
        self.assertEqual(headers["Cache-Control"], "no-store")
        self.assertEqual(json.loads(raw), result)

    def test_arbitrary_files_not_served(self):
        for path in ["/../server.py", "/.runtime/model.log", "/README.md"]:
            self.assertEqual(self.call(path)[0], 404)

    def test_app_uses_only_local_assets(self):
        status, headers, raw = self.call("/")
        self.assertEqual(status, 200)
        self.assertIn("connect-src 'self'", headers["Content-Security-Policy"])
        self.assertNotIn(b"https://", raw)


if __name__ == "__main__":
    unittest.main()
