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
    'click button': 'onClick'
  },

  onShow: function() {

  },

  onClick: function (event) {
    //console.log(this.options.collection.models)
    return true;
  },

  initialize: function(options) {
    //this.options = options;
  },
});
