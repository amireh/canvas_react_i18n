
/** @jsx React.DOM */
define(function(require) {
  var React = require('react');
  var K = require('../../../constants');
  var Text = require('jsx!../../../components/text');
  var I18n = require('i18n!quiz_statistics');

  var Help = React.createClass({
    render: function() {
      return(
        <div>
          <div dangerouslySetInnerHTML={{ __html: (function(){var wrapper={"****":"<a href=\"%{article_url}\" target=\"_blank\">$1</a>","***":"<p>$1</p>","**":"<p>$1</p>","*":"<p>$1</p>"};return I18n.t("discrimination_index_help", "* This metric provides a measure of how well a single question can tell the difference (or discriminate) between students who do well on an exam and those who do not. * ** It divides students into three groups based on their score on the whole quiz and displays those groups by who answered the question correctly. ** *** More information is available **** here **** . ***", {"article_url":K.DISCRIMINATION_INDEX_HELP_ARTICLE_URL,"wrapper":wrapper});}()) }} />

          <span>Separator</span>

          <div dangerouslySetInnerHTML={{ __html: (function(){var wrapper={};return I18n.t("adooken", "Adooken!", {"wrapper":wrapper});}()) }} />
          <div dangerouslySetInnerHTML={{ __html: (function(){var wrapper={};return I18n.t("adooken_y", "Adooken Y!", {"wrapper":wrapper});}()) }} />
          <div dangerouslySetInnerHTML={{ __html: (function(){var wrapper={"*":"<p>$1</p>"};return I18n.t("foo", "* This metric provides a measure of how well a single question can tell the difference (or discriminate) between students who do well on an exam and those who do not. *", {"wrapper":wrapper});}()) }} />
        </div>
      );
    }
  });

  return Help;
});