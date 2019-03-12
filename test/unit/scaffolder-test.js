import fs from 'mz/fs';
import {assert} from 'chai';
import any from '@travi/any';
import sinon from 'sinon';
import {scaffold} from '../../src';

suite('scaffolder', () => {
  let sandbox;
  const projectRoot = any.string();
  const projectName = any.string();

  setup(() => {
    sandbox = sinon.createSandbox();

    sandbox.stub(fs, 'writeFile');
  });

  teardown(() => sandbox.restore());

  test('that the package file is written', async () => {
    fs.writeFile.resolves();

    await scaffold({projectRoot, projectName});

    assert.calledWith(fs.writeFile, `${projectRoot}/package.json`, JSON.stringify({name: projectName}));
  });
});
