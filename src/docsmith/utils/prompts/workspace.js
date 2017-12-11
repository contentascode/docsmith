/* global defaults prompt */
module.exports = {
  workspace: non_interactive
    ? 'yes'
    : prompt('Please confirm initialisation of the workspace in the current directory (no/yes)', 'no', function(
        response
      ) {
        if (typeof response !== 'string' || !response) {
          const er = new Error('Sorry, invalid input. Please enter `yes` or `no`.');
          er.notValid = true;
          return er;
        } else if (response.toLowerCase() === 'yes') {
          return 'yes';
        } else if (response.toLowerCase() === 'no') {
          return 'no';
        }
        const er = new Error('Sorry, invalid input. Please enter `yes` or `no`.');
        er.notValid = true;
        return er;
      })
};
