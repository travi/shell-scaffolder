import inquirer from 'inquirer';
import * as commonLanguagePrompts from '@travi/language-scaffolder-prompts';
import fs from 'mz/fs';
import {assert} from 'chai';
import any from '@travi/any';
import sinon from 'sinon';
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

    commonLanguagePrompts.questions.withArgs({vcs, ciServices, visibility}).returns(questions);
  });

  teardown(() => sandbox.restore());

  test('that the package file and Makefile are written', async () => {
    fs.writeFile.resolves();
    inquirer.prompt.withArgs(questions).resolves({[commonLanguagePrompts.questionNames.UNIT_TESTS]: false});

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
        vcsIgnore: {files: [], directories: ['/deps']}
      }
    );
    assert.calledWith(fs.writeFile, `${projectRoot}/package.json`, JSON.stringify({name: projectName, description}));
    assert.calledWith(
      fs.writeFile,
      `${projectRoot}/Makefile`,
      `.DEFAULT_GOAL := test

lint:
  shellcheck **/*.sh

test: lint

clean:
  rm -rf ./deps/

.PHONY: lint
`
    );
  });

  test('that testing tool installation instructions are included when the project will be unit tested', async () => {
    inquirer.prompt.withArgs(questions).resolves({[commonLanguagePrompts.questionNames.UNIT_TESTS]: true});

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
