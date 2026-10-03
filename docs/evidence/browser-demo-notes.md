# QuietPrep practice notes

Role: Junior frontend developer

## Tell me about a time you improved a search feature in a project you worked on.

### Attempt 1

In my college project, I built a library search form in React. I noticed it sent a request on each keystroke. I added a 300 millisecond debounce. I used the Network tab to check requests. I learned to test a change before calling it finished.

**Keep this:** You describe a specific action and a measurable outcome using a tool like the Network tab.

> I used the Network tab to check requests.

**Try this next:** Explain how the debounce improved user experience beyond just reducing requests.
Name one user experience benefit that resulted from the debounce.

**Follow-up:** How would you know if the change made the search feel faster to users?

### Attempt 2

In my college project, I built a library search form in React. I noticed it sent a request on each keystroke. I added a 300 millisecond debounce. I used the Network tab to check requests. I learned to test a change before calling it finished. With the same query, I counted 36 requests before and one request after the change. I checked that keyboard navigation still worked. I have not tested whether users prefer the change.

**Keep this:** You show a measurable outcome: 36 requests reduced to one with the same query.

> With the same query, I counted 36 requests before and one request after the change.

**Try this next:** Explain how the debounce improved user experience beyond just reducing requests.
Add a specific user experience benefit, like faster response time or less lag.

**Follow-up:** How did the change affect how users felt when typing in the search bar?

**My reflection:** partly

Synthetic test reflection: the quotation was useful; I still need to check the advice.

## What changed

Compared attempt 1 with attempt 2.
31 words added; 0 words removed. These counts are not a quality score.

### AI reflection

The answer now includes specific evidence of user experience improvement by showing reduced requests and checking accessibility, without claiming user preference.
Before: I noticed it sent a request on each keystroke.
Now: With the same query, I counted 36 requests before and one request after the change.
Explain how the reduced requests made the search feel smoother or more responsive to users, using a real example.

AI coaching is a practice aid, not a hiring verdict. Verify technical advice.
