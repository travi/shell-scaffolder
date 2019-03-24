import {prompt} from 'inquirer';
import {writeFile} from 'mz/fs';
import {questions, questionNames} from '@travi/language-scaffolder-prompts';

export default async function ({projectRoot, projectName, description, vcs, ciServices, visibility}) {
  const {[questionNames.UNIT_TESTS]: unitTested} = await prompt(questions({vcs, ciServices, visibility}));

  await Promise.all([
    writeFile(`${projectRoot}/package.json`, JSON.stringify({name: projectName, description})),
    writeFile(
      `${projectRoot}/Makefile`,
      `.DEFAULT_GOAL := test

lint:
  shellcheck **/*.sh

test: lint

clean:
  rm -rf ./deps/

.PHONY: lint
`
    )
  ]);

  return {
    documentation: {
      usage: `### Installation
\`\`\`sh
$ bpkg install ${projectName}
\`\`\``,
      contributing: `### Global Tool Installation

Be sure the following global installations are available:

* [Shellcheck](https://github.com/koalaman/shellcheck#installing)
* [bpkg](https://github.com/bpkg/bpkg#install)

${unitTested
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
