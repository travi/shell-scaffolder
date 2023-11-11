import {promises as fs} from 'fs';
import * as prompts from '@form8ion/overridable-prompts';
import * as commonLanguagePrompts from '@travi/language-scaffolder-prompts';

import {describe, it, vi, expect, beforeEach, afterEach} from 'vitest';
import any from '@travi/any';
import {when} from 'jest-when';

import * as ciScaffolder from './ci-scaffolder.js';
import {scaffold} from './index.js';

describe('scaffolder', () => {
  const projectRoot = any.string();
  const projectName = any.string();
  const description = any.sentence();
  const vcs = any.simpleObject();
  const ciServices = any.simpleObject();
  const visibility = any.word();
  const questions = any.listOf(any.simpleObject);

  beforeEach(() => {
    vi.mock('fs');
    vi.mock('@form8ion/overridable-prompts');
    vi.mock('@travi/language-scaffolder-prompts');
    vi.mock('./ci-scaffolder');

    when(commonLanguagePrompts.questions).calledWith({vcs, ciServices, visibility}).mockReturnValue(questions);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create the package file and Makefile', async () => {
    const chosenService = any.word();
    const ciFilesToIgnore = any.listOf(any.word);
    const ciDirectoriesToIgnore = any.listOf(any.word);
    when(prompts.prompt).calledWith(questions).mockResolvedValue({
      [commonLanguagePrompts.questionNames.UNIT_TESTS]: false,
      [commonLanguagePrompts.questionNames.CI_SERVICE]: chosenService
    });
    when(ciScaffolder.default)
      .calledWith(ciServices, chosenService, {projectRoot})
      .mockResolvedValue({
        ...any.simpleObject(),
        vcsIgnore: {files: ciFilesToIgnore, directories: ciDirectoriesToIgnore}
      });

    const result = await scaffold({projectRoot, projectName, description, vcs, ciServices, visibility});

    expect(result).toEqual({
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
    });
    expect(fs.writeFile).toHaveBeenCalledWith(
      `${projectRoot}/package.json`,
      JSON.stringify({name: projectName, description, scripts: [`${projectName}.sh`], install: 'make install'})
    );
    expect(fs.writeFile).toHaveBeenCalledWith(`${projectRoot}/${projectName}.sh`, '#!/bin/sh');
    expect(fs.writeFile).toHaveBeenCalledWith(
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

  it('should include testing tool installation instructions when the project will be unit tested', async () => {
    when(prompts.prompt)
      .calledWith(questions)
      .mockResolvedValue({[commonLanguagePrompts.questionNames.UNIT_TESTS]: true});
    ciScaffolder.default.mockResolvedValue({vcsIgnore: {files: [], directories: []}});

    const result = await scaffold({projectRoot, projectName, description, vcs, ciServices, visibility});

    expect(result.documentation.contributing).toEqual(`### Global Tool Installation

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
\`\`\``);
  });
});
