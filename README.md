Demo:

Represents as "calendar creator"
http://secure-springs-78332.herokuapp.com/?cid=NCKAA8&test=test
(There might be slight loadtime as data will be loaded via rest-api. There should be at least one marked date per month.)

Represents app as you are visitor.
http://secure-springs-78332.herokuapp.com/?cid=NCKAA8&test=test1

Visitor can have one (1) reservation.

cid = Calendar code which is unique.
test = test-username

Backend only takes requests from above url due by the CORS-rule.


Break it! :)

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
