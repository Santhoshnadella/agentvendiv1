export default function transformer(file, api) {
  const j = api.jscodeshift;
  const root = j(file.source);

  let usesQuery = false;

  // Find all db.prepare(Q).run(A), db.prepare(Q).get(A), db.prepare(Q).all(A)
  root.find(j.CallExpression, {
    callee: {
      type: 'MemberExpression',
      object: {
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { name: 'db' },
          property: { name: 'prepare' }
        }
      }
    }
  }).forEach(path => {
    const isRun = path.node.callee.property.name === 'run';
    const isGet = path.node.callee.property.name === 'get';
    const isAll = path.node.callee.property.name === 'all';
    
    if (isRun || isGet || isAll) {
      usesQuery = true;
      const sqlNode = path.node.callee.object.arguments[0];
      const paramsNodes = path.node.arguments;
      
      const functionName = (isGet) ? 'querySingle' : 'query';
      
      const newCall = j.awaitExpression(
        j.callExpression(
          j.identifier(functionName),
          [sqlNode, j.arrayExpression(paramsNodes)]
        )
      );
      
      j(path).replaceWith(j.parenthesizedExpression(newCall));
    }
  });

  // Make surrounding Express routes async
  root.find(j.CallExpression, {
    callee: {
      type: 'MemberExpression',
      object: { name: 'router' }
    }
  }).forEach(path => {
      const args = path.node.arguments;
      if (args && args.length > 0) {
          const lastArg = args[args.length - 1];
          if (lastArg.type === 'ArrowFunctionExpression' || lastArg.type === 'FunctionExpression') {
              lastArg.async = true;
          }
      }
  });

  // Handle app.get, app.post etc in index.js or similar
  root.find(j.CallExpression, {
    callee: {
      type: 'MemberExpression',
      object: { name: 'app' }
    }
  }).forEach(path => {
      const args = path.node.arguments;
      if (args && args.length > 0) {
          const lastArg = args[args.length - 1];
          if ((lastArg.type === 'ArrowFunctionExpression' || lastArg.type === 'FunctionExpression') && lastArg.params.length >= 2) {
              lastArg.async = true;
          }
      }
  });

  // Also methods in classes e.g. AgentRuntime.start()
  // Wait, AgentRuntime start and callLLM etc. are already async. Let's make sure any function containing await query is async.
  root.find(j.AwaitExpression).forEach(path => {
    let parent = path.parent;
    while (parent && parent.node.type !== 'FunctionDeclaration' && parent.node.type !== 'FunctionExpression' && parent.node.type !== 'ArrowFunctionExpression' && parent.node.type !== 'ClassMethod') {
      parent = parent.parent;
    }
    if (parent) {
      parent.node.async = true;
    }
  });

  // Import adjustments
  if (usesQuery) {
    root.find(j.ImportDeclaration).forEach(path => {
      if (path.node.source.value.includes('db.js')) {
        const specifiers = path.node.specifiers;
        const hasQuery = specifiers.some(s => s.imported && s.imported.name === 'query');
        if (!hasQuery) {
            specifiers.push(j.importSpecifier(j.identifier('query')));
            specifiers.push(j.importSpecifier(j.identifier('querySingle')));
        }
      }
    });
  }

  return root.toSource({ quote: 'single' });
}
