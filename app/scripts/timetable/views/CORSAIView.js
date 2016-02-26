'use strict';

var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var config = require('../../common/config');
var template = require('../templates/corsai.hbs');

module.exports = Marionette.ItemView.extend({
  attributes: { 'style': 'margin-left: auto; margin-right: auto; text-align: center' },
  template: template,

  events: {
    'click a': 'onClick'
  },

  onClick: function (event) {
    return false;
  },

  initialize: function(options) {
    this.options = options;
  },
});
