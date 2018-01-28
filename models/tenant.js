'use strict';

const uuidV1 = require('uuid/v1');

module.exports = (Tenant) => {
  var methodNames = [
    'replaceOrCreate', 'patchOrCreate', 'findOne',
    'findById', 'destroyById',
    'count', 'exists', 'replaceById', 'prototype.patchAttributes',
    'replaceById', 'upsertWithWhere', 'createChangeStream',
    'updateAll', 'find',
  ];

  methodNames.forEach((name) => {
    Tenant.disableRemoteMethodByName(name);
  });

  Tenant.validateAsync('key', keyValidator,
    {
      message: 'Key already exists',
      code: 'uniqueness',
    }
  );

  function keyValidator(err, done) {
    if (this.key) {
      Tenant.find({where: {key: this.key}})
        .then((result) => {
          if (result.length > 0) {
            err();
          }
          done();
        });
    } else {
      this.key = uuidV1();
     
    }
    done();
  };
};
