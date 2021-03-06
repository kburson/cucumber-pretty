const { Formatter, SummaryFormatter } = require('cucumber');
const { EOL } = require('os');

class PrettyFormatter extends Formatter {
  constructor(options) {
    super(options);
    /**
     * @property colorFns - a series of helper functions for outputting colors
     * @property colorsEnabled
     * @property cwd - the current working directory
     * @property eventBroadcaster - an event emitter that emits the event protocol
     * @property eventDataCollector - an instance of EventDataCollector which handles the complexity of grouping the data for related events
     * @property log - function which will write the passed string to the the designated stream
     * @property snippetBuilder - an object with a build method that should be called with {keywordType, pickleStep}
     * @property stream - the underlying stream the formatter is writing to
     * @property supportCodeLibrary
     *
     * @property {boolean} [pretty.passed=false] - Log passed status
     * @property {boolean} [pretty.summary=true] - Log summary
     *
     * @see https://docs.cucumber.io/event-protocol/
     * @see https://github.com/cucumber/cucumber-js/blob/master/docs/custom_formatters.md
     */
    this.options = options;

    this.noptions = Object.create(options);
    this.noptions.eventBroadcaster = { on: () => {} };

    const features = [];

    options.eventBroadcaster.on('test-case-started', event => {
      const data = this.eventDataCollector.getTestCaseData(event.sourceLocation);

      if (!features.includes(event.sourceLocation.uri)) {
        const feature = data.gherkinDocument.feature;

        this.logln();

        if (feature.tags.length) {
          const tags = feature.tags.map(tag => tag.name).join(' ');
          this.logln(tags, 'tag');
        }

        const keyword = this.color('blue', feature.keyword);
        this.logln(`${keyword}: ${feature.name}`);

        features.push(event.sourceLocation.uri);
      }

      this.logln();

      if (data.pickle.tags.length) {
        const tags = data.pickle.tags.map(tag => tag.name).join(' ');
        this.logln(`  ${tags}`, 'tag');
      }

      const keyword = this.color('blue', 'Scenario');
      this.logln(`  ${keyword}: ${data.pickle.name}`);
    });

    options.eventBroadcaster.on('test-step-started', event => {
      const data = this.eventDataCollector.getTestStepData(event);
      if (data.testStep.sourceLocation) {
        const keyword = this.color('blue', data.gherkinKeyword);
        this.logln(`    ${keyword}${data.pickleStep.text}`);
      }
    });

    options.eventBroadcaster.on('test-step-finished', event => {
      const status = event.result.status;
      if (status === 'passed' && !this.option('passed', false)) {
        return;
      }

      const data = this.eventDataCollector.getTestStepData(event);
      if (data.testStep.sourceLocation) {
        this.logln(`      ${status}`, status);
      }
    });

    // options.eventBroadcaster.on('test-case-finished', event => {
    // });

    if (this.option('summary', true)) {
      options.eventBroadcaster.on('test-run-finished', event => {
        this.logln();
        new SummaryFormatter(this.noptions).logSummary(event);
      });
    }
  }

  /**
   * Get format option
   * @param {string} key - Pretty key
   * @param {*} value - Default value
   * @return {*} Pretty value or default value if key is undefined
   * @example
   * // --format-options '{ "pretty": { "foo": "baz" } }'
   * this.get('foo', 'bar'); // === 'baz'
   */
  option(key, value) {
    const pretty = this.options.pretty;
    return pretty && pretty.hasOwnProperty(key) ? pretty[key] : value;
  }

  /**
   * Colour text respecting colorsEnabled option
   * @param {string} color - colorFns key
   * @param {string} value - Text to colour
   * @return {string} Coloured text
   */
  color(color, value) {
    return this.options.colorsEnabled ? this.colorFns[color](value) : value;
  }

  /**
   * Log line
   * @param {string} [value] - Text
   * @param {string} [color] - Text colour
   */
  logln(value = '', color = '') {
    if (color) value = this.color(color, value);
    this.log(`${value}${EOL}`);
  }
}

module.exports = PrettyFormatter;
