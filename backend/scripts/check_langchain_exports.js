try {
  const langchain = require('langchain');
  console.log(
    'langchain exports:',
    Object.keys(langchain).filter((k) => k.includes('Agent') || k.includes('Middleware'))
  );

  const agents = require('langchain/agents');
  console.log(
    'langchain/agents exports:',
    Object.keys(agents).filter((k) => k.includes('create'))
  );

  // Check for the specific requested exports if they exist on root
  console.log('Has createAgent:', !!langchain.createAgent);
  console.log('Has todoListMiddleware:', !!langchain.todoListMiddleware);
  console.log('Has llmToolSelectorMiddleware:', !!langchain.llmToolSelectorMiddleware);
} catch (e) {
  console.error(e);
}
