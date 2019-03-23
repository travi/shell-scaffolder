import {writeFile} from 'mz/fs';

export default async function ({projectRoot, projectName, description}) {
  await writeFile(`${projectRoot}/package.json`, JSON.stringify({name: projectName, description}));

  return {
    documentation: {
      usage: `### Installation
\`\`\`sh
$ bpkg install ${projectName}
\`\`\``
    },
    projectDetails: {},
    badges: {consumer: {}, status: {}, contribution: {}}
  };
}
