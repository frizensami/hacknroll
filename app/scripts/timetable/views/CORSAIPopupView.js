'use strict';

var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var _ = require('underscore');
var config = require('../../common/config');
var template = require('../templates/corsaipopup.hbs');

module.exports = Marionette.ItemView.extend({
  attributes: {},
  template: template,

	initialize: function(options) {
    this.options = options.fields;
		$('.form_popup').popup();
  },
});
