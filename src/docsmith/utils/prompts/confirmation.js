/* global defaults prompt */
module.exports = {
  confirm: non_interactive
    ? 'yes'
    : prompt('Please type "yes" to confirm that you would like to proceed (yes/no)', 'no', function(response) {
        if (typeof response !== 'string' || !response) {
          const er = new Error('Sorry, invalid input. Please enter `yes` or `no`.');
          er.notValid = true;
          return er;
        } else if (response.toLowerCase() === 'yes') {
          return true;
        } else if (response.toLowerCase() === 'no') {
          return false;
        }
        const er = new Error('Sorry, invalid input. Please enter `yes` or `no`.');
        er.notValid = true;
        return er;
      })
};
