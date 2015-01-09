
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
          <Text
            key="discrimination_index_help"
            articleUrl={K.DISCRIMINATION_INDEX_HELP_ARTICLE_URL}>
            <p>
              This metric provides a measure of how well a single question can tell the
              difference (or discriminate) between students who do well on an exam and
              those who do not.
            </p>

            <p>
              It divides students into three groups based on their score on the whole
              quiz and displays those groups by who answered the question correctly.
            </p>

            <p>
              More information is available
              <a
                href="%{article_url}"
                target="_blank">
                here
              </a>
              .
            </p>
          </Text>

          <span>Separator</span>

          <Text key="adooken">Adooken!</Text>
          <Text key="adooken_y">Adooken Y!</Text>
          <Text key="foo">
            <p>
              This metric provides a measure of how well a single question can tell the
              difference (or discriminate) between students who do well on an exam and
              those who do not.
            </p>
          </Text>
          <Text>
            Hey {this.props.amigo}!
            Although I am <a href="/" title={this.props.title}>linking to something</a> and have some
            <strong>bold text</strong>, the translators will see <em>
            absolutely no markup</em> and will only have a single
            string to translate :o
          </Text>
        </div>
      );
    }
  });

  return Help;
});
