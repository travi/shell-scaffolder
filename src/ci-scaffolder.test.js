import {describe, it, vi, expect} from 'vitest';
import any from '@travi/any';
import {when} from 'jest-when';

import scaffoldCi from './ci-scaffolder.js';

describe('ci', () => {
  it('should pass the necessary data to the service scaffolder', async () => {
    const options = any.simpleObject();
    const chosenService = any.word();
    const chosenServiceScaffolder = vi.fn();
    const scaffolders = {...any.simpleObject(), [chosenService]: {scaffolder: chosenServiceScaffolder}};
    const scaffolderResult = any.simpleObject();
    when(chosenServiceScaffolder).calledWith(options).mockResolvedValue(scaffolderResult);

    const result = await scaffoldCi(scaffolders, chosenService, options);

    expect(result).toEqual(scaffolderResult);
  });

  it('should not result in an error when choosing a scaffolder without a defined service', () => {
    expect(scaffoldCi(any.simpleObject(), any.word(), any.simpleObject()))
      .toEqual({vcsIgnore: {files: [], directories: []}});
  });
});
