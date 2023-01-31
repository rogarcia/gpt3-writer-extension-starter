
// Function to get + decode API key
const getKey = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['openai-key'], (result) => {
      if (result['openai-key']) {
        const decodedKey = atob(result['openai-key']);
        resolve(decodedKey);
      }
    });
  });
};

const sendMessage = (content) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0].id;

    chrome.tabs.sendMessage(
      activeTab,
      { message: 'inject', content },
      (response) => {
        if (response.status === 'failed') {
          console.log('injection failed.');
        }
      }
    );
  });
};

const generate = async (prompt) => {
  // Get your API key from storage
  const key = await getKey();
  const url = 'https://api.openai.com/v1/completions';
	
  // Call completions endpoint
  const completionResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 1250,
      temperature: 0.7,
    }),
  });
	
  // Select the top choice and send back
  const completion = await completionResponse.json();
  return completion.choices.pop();
}

const generateCompletionAction = async (info) => {
  try {
    // Send mesage with generating text (this will be like a loading indicator)
    sendMessage('generating...');
      
    const { selectionText } = info;
    const basePromptPrefix = `
	You are an expert respected leader, problem solver, complex system designer, first-principles thinker, agile project management thought-leader, successful entrepreneur, founder of many multi-million dollar startups. Write a comprehensive problem statement for the issue below, including any uncertainties that pose a challenge for developing a viable solution.

        Issue:
	`;
    const baseCompletion = await generate(`${basePromptPrefix}${selectionText}`);
    console.log(baseCompletion.text);

    // Add your second prompt here
    const secondPrompt = `
      You are an expert respected leader, problem solver, complex system designer, first-principles thinker, agile project management thought-leader, successful entrepreneur, founder of many multi-million dollar startups. Write me a detailed break down of the iterative experimental development tasks to create a viable solution for the problem statement below.

      Problem statement: ${baseCompletion.text}
      `;

    // Call your second prompt
    const secondPromptCompletion = await generate(secondPrompt);

    // Send the output when we're all done
    sendMessage(secondPromptCompletion.text);  
    console.log(secondPromptCompletion.text);
  } catch (error) {
    console.log(error);

    // Add this here as well to see if we run into any errors!
    sendMessage(error.toString());
  }
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'context-run',
    title: 'Generate project tasks',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener(generateCompletionAction);

