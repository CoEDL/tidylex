HTMLWidgets.widget({

  name: 'nearley-railroad',

  type: 'output',

  factory: function(el, width, height) {

    return {

      renderValue: function(railroad_html) {

        // HTML returned from railroad() function during grammar compile time
        // see inst/nearley/in.js for the code
        el.innerHTML = railroad_html;

      },

      resize: function(width, height) {

        // TODO: code to re-render the widget with a new size

      }

    };
  }
});