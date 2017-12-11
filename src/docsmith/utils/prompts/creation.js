/* global non_interactive templates default_name default_template prompt */

const validate_name = name => /[\w|_]/.test(name);

const list_templates = templates =>
  Object.keys(templates).map(template => ' - ' + template + ' : ' + templates[template] + '\n');

module.exports = {
  name: non_interactive
    ? default_name
    : prompt('Please enter the name of the new content package you wish to create', default_name, function(response) {
        if (!validate_name(response)) {
          const er = new Error('Please make sure the name only contains letters and underscores.');
          er.notValid = true;
          return er;
        }
        return response;
      }),
  template: non_interactive
    ? default_template
    : prompt(
        'The following templates are available:\n' +
          list_templates(templates) +
          '\nPlease enter the name of the template you with to use',
        default_template,
        function(response) {
          if (!Object.keys(templates).includes(response)) {
            const er = new Error('Please make sure the template is one of:\n' + list_templates(templates));
            er.notValid = true;
            return er;
          }
          return response;
        }
      )
};
