'use strict';
const loopback = require('loopback');
const typeCache = {};

module.exports = function (Content) {
  var methodNames = [
    'replaceOrCreate', 'patchOrCreate', 'findOne',
    'findById', 'destroyById',
    'count', 'exists', 'replaceById', 'prototype.patchAttributes',
    'replaceById', 'upsertWithWhere', 'createChangeStream',
    'updateAll', 'create', 'find'
  ];

  const fastCheck = (key, type) => {
    typeCache[key] = typeCache[key] || {};
    return typeCache[key][type];
  }

  const setCache = (key, type) => {
    typeCache[key] = typeCache[key] || {};
    typeCache[key][type] = true;
  }

  methodNames.forEach((name) => {
    Content.disableRemoteMethodByName(name);
  });

  Content.validateAsync('type', typeValidator,
    {
      message: 'Invalid content type specified for the content',
      code: 'exists',
    }
  );

  function typeValidator(err, done) {
    if (this.tenantKey && this.type) {
      // fast check if validated before
      if (fastCheck(this.tenantKey, this.type)) done();
      // query to db to validate
      loopback.getModelByType('contentType')
        .find({
          where: {
            tenantKey: this.tenantKey, name: this.type,
            active: true
          }
        })
        .then((result) => {
          if (result.length != 1) {
            err();
          } else {
            setCache(this.tenantKey, this.type);
          }
          done();
        });
    }
  };

  Content.validateAsync('data', dataValidator,
    {
      message: 'Schema check failed',
      code: 'schemaCheck',
    }
  );

  function dataValidator(err, done) {
    if (this.data) {
      loopback.getModelByType('contentType')
        .find({ where: { tenantKey: this.tenantKey, name: this.type } })
        .then((result) => {
          if (result.length != 1) {
            err();
          }
          done();
        });
    }
  };


  Content.add = function (tenantKey, name, data, cb) {
    data.tenantKey = tenantKey;
    return Content.create(data, cb);
  };

  Content.get = function (key, filter, cb) {
    filter = filter || {};
    filter.where = filter.where || {};
    filter.where.tenantKey = key;
    return Content.find(filter, cb);
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



}