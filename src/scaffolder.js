import {writeFile} from 'mz/fs';

export default async function ({projectRoot, projectName}) {
  await writeFile(`${projectRoot}/package.json`, JSON.stringify({name: projectName}));

  return {
    documentation: {
      usage: `### Installation
\`\`\`sh
$ bpkg install ${projectName}
\`\`\``
    }
  };
}
