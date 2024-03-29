import {promises as fs} from 'node:fs';
import {prompt} from '@form8ion/overridable-prompts';
import {questions, questionNames} from '@travi/language-scaffolder-prompts';

import scaffoldCi from './ci-scaffolder.js';

export default async function ({projectRoot, projectName, description, vcs, ciServices, visibility}) {
  const {
    [questionNames.UNIT_TESTS]: unitTested,
    [questionNames.CI_SERVICE]: chosenCiService
  } = await prompt(questions({vcs, ciServices, visibility}));

  const [ciServiceResults] = await Promise.all([
    scaffoldCi(ciServices, chosenCiService, {projectRoot}),
    fs.writeFile(`${projectRoot}/${projectName}.sh`, '#!/bin/sh'),
    fs.writeFile(
      `${projectRoot}/package.json`,
      JSON.stringify({name: projectName, description, scripts: [`${projectName}.sh`], install: 'make install'})
    ),
    fs.writeFile(
      `${projectRoot}/Makefile`,
      `.DEFAULT_GOAL := test

lint:
\tshellcheck *.sh

test: lint

clean:
\trm -rf ./deps/

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
    verificationCommand: 'make test',
    vcsIgnore: {
      files: ciServiceResults.vcsIgnore.files,
      directories: ['/deps', ...ciServiceResults.vcsIgnore.directories]
    }
  };
}
