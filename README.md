```
npm install bing-sydney-ai
```

# Examples

```ts
import { SydneyClient } from "./sydney";
import Message from "./sydney/Message";
import SearchResult from "./sydney/SearchResult";

(async () => {
    let sydney = new SydneyClient();
    await sydney.startConversation();
    sydney.setSearch(false);
    let response: Message = await sydney.ask('what do you see on this image?', {
        attachment: 'test.png',
        
        webSearch: (search: SearchResult[]) => {
            console.log('Web search results:');

            for (let searchResult of search) {
                console.log('Title:', searchResult.title);
                console.log('URL:', searchResult.url);
                console.log('Snippets:', searchResult.snippets.join('\n'));
                console.log('---');
            }
        },
        messageUpdate: (message: Message) => {
            console.log('Message update:', message.text);
        },
        messageAdded: (message: Message) => {
            console.log('Message added:', message.text);
        }
    });

    console.log('Response:', response.text);
    console.log('suggested responses:', response.suggestedResponses);
})();
```

# Contribute
https://github.com/borsuczyna/bing-sydney-ai