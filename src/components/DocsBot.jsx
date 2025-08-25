import { useEffect } from 'react';
import './DocsBot.css';

const DocsBot = () => {
  useEffect(() => {
    // Initialize DocsBot
    window.DocsBotAI = window.DocsBotAI || {};
    window.DocsBotAI.init = function(e) {
      return new Promise((t,r) => {
        var n = document.createElement("script");
        n.type = "text/javascript";
        n.async = !0;
        n.src = "https://widget.docsbot.ai/chat.js";
        let o = document.getElementsByTagName("script")[0];
        o.parentNode.insertBefore(n,o);
        n.addEventListener("load", () => {
          let n;
          Promise.all([
            new Promise((t,r) => {
              window.DocsBotAI.mount(Object.assign({}, e)).then(t).catch(r)
            }),
            (n = function e(t) {
              return new Promise(e => {
                if(document.querySelector(t)) return e(document.querySelector(t));
                let r = new MutationObserver(n => {
                  if(document.querySelector(t)) return e(document.querySelector(t)),r.disconnect()
                });
                r.observe(document.body, {childList:!0,subtree:!0})
              })
            })("#docsbotai-root"),
          ]).then(() => t()).catch(r)
        });
        n.addEventListener("error", e => {r(e.message)})
      })
    };

    // Initialize the widget with custom options
    DocsBotAI.init({
      id: "BEN1YpwH0ODr8pzVSYi7/vx93y1TMRtxXOHukRXu8",
      // Add options to show only the widget icon initially
      startMinimized: true,
      hideDefaultLauncher: false,
      disableWelcomeMessage: true
    });
  }, []);

  // We don't need to render anything ourselves, the script will handle it
  return null;
};

export default DocsBot; 