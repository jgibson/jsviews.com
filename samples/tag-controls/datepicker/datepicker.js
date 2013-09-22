﻿(function(global, $, undefined) {
// global is the this object, which is window when running in the usual browser environment.
// $ is the global var jQuery
"use strict";

$.views.tags({
  datepicker: {
    init: function(tagCtx, linkCtx) {
      if (this._.inline && !tagCtx.content) {
        this.template = tagCtx.tmpl = "<input/>";
      }
    },
    onAfterLink: function(tagCtx, linkCtx) {
      linkCtx.convertBack = tagCtx.props.convertBack;
      linkCtx.convert = tagCtx.props.convert;

      var tag = this;
      if (!tag.linkedElem) {
        tag.linkedElem = tag._.inline ? tag.contents("*").first() : $(linkCtx.elem);
      }
      tag.isInput = tag.linkedElem[0].tagName === "INPUT";
      if (!tag.datepicker) {
        var settings = $.extend({
          onSelect: function(dateText, inst) {
            tag.value = dateText;
            tag.update(dateText);
          }
        }, tagCtx.props);
        tag.datepicker = tag.linkedElem.datepicker(settings).data("datepicker");
      } else {
        tag.linkedElem.datepicker("option", tagCtx.props);
      }
      if (tagCtx.args[0] !== undefined && !tag.isInput) {
        tag.setValue(tagCtx.args[0]);
      }
    },
    onUpdate: function(ev, eventArgs, tagCtxs) {
      return false; // return false so as not to re-render every time.
      // Here we don't need to render, so return false for better perf.
    },
    //onBeforeChange: function(ev, val) {
    //  return true; // return false to cancel change
    //},
    //onChange: function(val) {
    //  return val;
    //},
    setValue: function(value) {
      if (value !== undefined && value !== this.value) {
        this.value = value;
        this.linkedElem.datepicker("setDate", value);
      }
    },
    getValue: function() {
      return this.value;
    },
    dataBoundOnly: true
  }
});
})(this, this.jQuery);
