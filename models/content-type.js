'use strict';
const loopback = require('loopback');

module.exports = function (ContentType) {
  var methodNames = [
    'replaceOrCreate', 'patchOrCreate', 'findOne',
    'findById', 'destroyById',
    'count', 'exists', 'replaceById', 'prototype.patchAttributes',
    'replaceById', 'upsertWithWhere', 'createChangeStream',
    'updateAll', 'create', 'find'
  ];

  methodNames.forEach((name) => {
    ContentType.disableRemoteMethodByName(name);
  });

  ContentType.validateAsync('tenantKey', keyValidator,
    {
      message: 'Invalid Key',
      code: 'exists',
    }
  );

  function keyValidator(err, done) {
    if (this.tenantKey) {
      loopback.getModelByType('tenant').find({
        where: {
          key: this.tenantKey,
          active: true
        }
      })
        .then((result) => {
          if (result.length != 1) {
            err();
          }
          done();
        });
    }
  };

  ContentType.validateAsync('name', nameValidator,
    {
      message: 'Content Type by the name already exists for the tenant',
      code: 'uniqueness',
    }
  );

  function nameValidator(err, done) {
    if (this.tenantKey && this.name) {
      ContentType.find({ where: { tenantKey: this.tenantKey, name: this.name } })
        .then((result) => {
          if (result.length > 0) {
            err();
          }
          done();
        });
    }
  };

  ContentType.add = function (tenantKey, data, cb) {
    data.tenantKey = tenantKey;
    return ContentType.create(data, cb);
  };

  ContentType.get = function (key, filter, cb) {
    filter = filter || {};
    filter.where = filter.where || {};
    filter.where.tenantKey = key;
    return ContentType.find(filter, cb);
  };

  ContentType.remoteMethod('add', {
    description: 'Create a new instance of the model and persist it into the data source.',
    accessType: 'WRITE',
    accepts: [
      {
        arg: 'key', type: 'string',
        description: 'Tenant key',
        http: { source: 'header' },
      },
      {
        arg: 'data', type: 'object', model: ContentType, allowArray: true,
        description: 'Model instance data',
        http: { source: 'body' },
      },
      { arg: 'options', type: 'object', http: 'optionsFromRequest' },
    ],
    returns: { arg: 'data', type: ContentType, root: true },
    http: { verb: 'post', path: '/' },
  });

  ContentType.remoteMethod('get', {
    description: 'Find all instances of the model matched by filter from the data source.',
    accessType: 'READ',
    accepts: [
      {
        arg: 'key', type: 'string',
        description: 'Tenant key',
        http: { source: 'header' },
      },
      {
        arg: 'filter', type: 'object', description:
          'Filter defining fields, where, include, order, offset, and limit - must be a ' +
          'JSON-encoded string ({"something":"value"})'
      },
      { arg: 'options', type: 'object', http: 'optionsFromRequest' },
    ],
    returns: { arg: 'data', type: [ContentType], root: true },
    http: { verb: 'get', path: '/' },
  });


};
