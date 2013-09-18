# Handlebars-Async

Make Handlebars async!

## Install

```bash
npm install handlebars-async
```

## Usage
```js
var Handlebars = require('handlebars');
var handlebarsAsync = require('handlebars-async');

handlebarsAsync(Handlebars);

Handlebars.registerHelper('async', function(arg1) {
  var done = this.async();

  setTimeout(function() {
    done(null, arg1.toUpperCase())
    done();
  }, 1000);
});

var tpl = Handlebars.compile('{{asyncHelper "value"}}');

tpl(function (err, result) {
  // result == "VALUE"
});
```


## Copyright

Copyright (c) 2010 Loïc Mahieu.
