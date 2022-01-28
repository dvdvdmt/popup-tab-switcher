## Communication with extension

There are two ways of communication between extension and Puppeteer. The first one is using
[externally_connectable](https://developer.chrome.com/docs/extensions/mv3/manifest/externally_connectable/)
key to allow sending messages using `runtime.sendMessage(extensionId, payload)` right from the
PageScript.

```plantuml
@startuml
Puppeteer -> PageScript: evaluate getSettings
PageScript -> Background: runtime.sendMessage(extensionId, getSettings)
note left
The ability to send messages
right from page scripts
should be turned on in manifest.json
by externally_connectable key
end note
PageScript <-- Background: runtime.onExternalMessage settings
Puppeteer <-- PageScript: settings
@enduml
```

The problem with `externally_connectable` is that it requires specification of a web-page domain to
enable `runtime.sendMessage` API. In case of E2E tests there are multiple file pages that can't be
specified in `externally_connectable.matches`.

To overcome this restriction `window.postMessage` mechanism could be used.

```plantuml
@startuml
Puppeteer -> PageScript: evaluate getSettings
PageScript -> ContentScript: window.postMessage getSettings
note right
The ContentScript that is listening for postMessage
is injected to the page by background script
or it is already present in case of the settings page
end note
ContentScript -> Background: port.sendMessage getSettings
ContentScript <-- Background: port.onMessage settings
PageScript <-- ContentScript: window.postMessage settings
Puppeteer <-- PageScript: window.onMessage settings
@enduml
```

The problem with `window.postMessage` mechanism is that you can't differentiate between messages
that come from PageScript and ContentScript because their `event.origin` are equal. To overcome this
we can differentiate senders looking into the payload data. This way PageScript will handle only
messages that don't have `type` key and ContentScript will handle messages that have `type` key.