## Popup rendering

The initial rendering of the content script on the page is the most important part of the extension
performance. Here is the diagram of communication between the Background (web-worker) and the
Content Script main thread (browser page).

```mermaid
sequenceDiagram
  autonumber
  Chrome ->> Background: on Command (Alt+Y)
  Background ->> ContentScript: init ContentScript
  Note over Background, ContentScript: Background executes ContentScript<br>in the context of the page
  ContentScript ->> Background: ContentScript started
  Background ->> ContentScript: show Popup
  ContentScript ->> Background: get Settings
  Background ->> ContentScript: Settings
  Note over ContentScript: ContentScript renders Popup
  ContentScript ->> Background: Popup shown
```

As you can see from the diagram there are 4 interactions (from 3 to 6) between the Background and
the ContentScript before its rendering is complete. The removal of those interactions may
significantly improve the performance of the extension and requires more investigation.
