chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'startAuthFlow') {
    chrome.identity.launchWebAuthFlow(
      {
        url: message.redirectUrl,
        interactive: true,
      },
      (responseUrl) => {
        if (chrome.runtime.lastError || !responseUrl) {
          console.error(chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError });
        } else {
          console.log('Redirect URL:', responseUrl);
          const url = new URL(responseUrl);

          const code = url.searchParams.get('code');
          console.log('background script obtained the code', code);
          sendResponse({ success: true, code });
        }
      },
    );

    return true;
  }
});
