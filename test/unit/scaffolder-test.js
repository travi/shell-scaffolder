import inquirer from 'inquirer';
import * as commonLanguagePrompts from '@travi/language-scaffolder-prompts';
import fs from 'mz/fs';
import {assert} from 'chai';
import any from '@travi/any';
import sinon from 'sinon';
import * as ciScaffolder from '../../src/ci-scaffolder';
import {scaffold} from '../../src';

suite('scaffolder', () => {
  let sandbox;
  const projectRoot = any.string();
  const projectName = any.string();
  const description = any.sentence();
  const vcs = any.simpleObject();
  const ciServices = any.simpleObject();
  const visibility = any.word();
  const questions = any.listOf(any.simpleObject);

  setup(() => {
    sandbox = sinon.createSandbox();

    sandbox.stub(fs, 'writeFile');
    sandbox.stub(inquirer, 'prompt');
    sandbox.stub(commonLanguagePrompts, 'questions');
    sandbox.stub(ciScaffolder, 'default');

    commonLanguagePrompts.questions.withArgs({vcs, ciServices, visibility}).returns(questions);
  });

  teardown(() => sandbox.restore());

  test('that the package file and Makefile are written', async () => {
    const chosenService = any.word();
    const ciFilesToIgnore = any.listOf(any.word);
    const ciDirectoriesToIgnore = any.listOf(any.word);
    fs.writeFile.resolves();
    inquirer.prompt
      .withArgs(questions)
      .resolves({
        [commonLanguagePrompts.questionNames.UNIT_TESTS]: false,
        [commonLanguagePrompts.questionNames.CI_SERVICE]: chosenService
      });
    ciScaffolder.default
      .withArgs(ciServices, chosenService, {projectRoot})
      .resolves({...any.simpleObject(), vcsIgnore: {files: ciFilesToIgnore, directories: ciDirectoriesToIgnore}});

    const result = await scaffold({projectRoot, projectName, description, vcs, ciServices, visibility});

    assert.deepEqual(
      result,
      {
        documentation: {
          usage: `### Installation
\`\`\`sh
$ bpkg install ${projectName}
\`\`\``,
          contributing: `### Global Tool Installation

Be sure the following global installations are available:

* [Shellcheck](https://github.com/koalaman/shellcheck#installing)
* [bpkg](https://github.com/bpkg/bpkg#install)

### Verification

\`\`\`sh
$ make test
\`\`\``
        },
        projectDetails: {},
        badges: {consumer: {}, status: {}, contribution: {}},
        verificationCommand: 'make test',
        vcsIgnore: {files: ciFilesToIgnore, directories: ['/deps', ...ciDirectoriesToIgnore]}
      }
    );
    assert.calledWith(
      fs.writeFile,
      `${projectRoot}/package.json`,
      JSON.stringify({name: projectName, description, scripts: [`${projectName}.sh`], install: 'make install'})
    );
    assert.calledWith(fs.writeFile, `${projectRoot}/${projectName}.sh`, '#!/bin/sh');
    assert.calledWith(
      fs.writeFile,
      `${projectRoot}/Makefile`,
      `.DEFAULT_GOAL := test

lint:
\tshellcheck *.sh

test: lint

clean:
\trm -rf ./deps/

.PHONY: lint
`
    );
  });

  test('that testing tool installation instructions are included when the project will be unit tested', async () => {
    inquirer.prompt.withArgs(questions).resolves({[commonLanguagePrompts.questionNames.UNIT_TESTS]: true});
    ciScaffolder.default.resolves({vcsIgnore: {files: [], directories: []}});

    const result = await scaffold({projectRoot, projectName, description, vcs, ciServices, visibility});

    assert.equal(
      result.documentation.contributing,
      `### Global Tool Installation

Be sure the following global installations are available:

* [Shellcheck](https://github.com/koalaman/shellcheck#installing)
* [bpkg](https://github.com/bpkg/bpkg#install)

### Dependencies

\`\`\`sh
$ bpkg install -g sstephenson/bats
\`\`\`

### Verification

\`\`\`sh
$ make test
\`\`\``
    );
  });
});
