import {prompt} from 'inquirer';
import {writeFile} from 'mz/fs';
import {questions, questionNames} from '@travi/language-scaffolder-prompts';

export default async function ({projectRoot, projectName, description, vcs, ciServices, visibility}) {
  const {[questionNames.UNIT_TESTS]: unitTested} = await prompt(questions({vcs, ciServices, visibility}));

  await writeFile(`${projectRoot}/package.json`, JSON.stringify({name: projectName, description}));

  return {
    documentation: {
      usage: `### Installation
\`\`\`sh
$ bpkg install ${projectName}
\`\`\``,
      contributing: `${unitTested
        ? `### Dependencies

\`\`\`sh
$ bpkg install -g sstephenson/bats
\`\`\`

`
        : ''}### Verification

\`\`\`sh
$ make test
\`\`\``
    },
    projectDetails: {},
    badges: {consumer: {}, status: {}, contribution: {}},
    vcsIgnore: {files: [], directories: ['/deps']}
  };
}
