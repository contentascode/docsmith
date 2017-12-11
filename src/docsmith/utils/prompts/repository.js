/* global defaults prompt */
module.exports = {
  repository: non_interactive
    ? default_path
    : prompt('Please confirm the location of your content repository', process.env.HOME + '/.content', function(
        response
      ) {
        if (response !== process.env.HOME + '/.content') {
          const er = new Error(
            'Sorry, for now only the `~/.content` folder is supported. Please accept the default value.'
          );
          er.notValid = true;
          return er;
        }
        return response;
      })
};
