# [NUSMods - Modified with CORSAI](http://nusmods.com)

## A fork of NUSMods with an automatic timetable arranging function. Just what you always wanted! Just click the Generate Timetable button on the home page, and choose your options!

## Setup with Vagrant

### Prerequisites

- [Vagrant](http://www.vagrantup.com/)
- [VirtualBox](https://www.virtualbox.org/)

### Setup

```bash
$ pip install ansible
$ vagrant up
```

Once it's up, do a `vagrant ssh` to enter the development environment.

## Setup without Vagrant

### Prerequisites

- [Node.js](http://nodejs.org)

### Setup

Install the necessary packages.
```bash
$ npm install -g bower grunt-cli
$ npm install
$ bower install
```

If you are working on `news.php`, make a copy of `/app/config/secrets.json.example` in the same directory and call it `secrets.json`. Add your Facebook App credentials into the file `secrets.json`.

## Building for Development

```bash
$ grunt serve
```

## Building for Production

To get a complete, minified, production build under `dist/`:

```bash
$ grunt
```

Alternatively, a version that ignores jshint warnings:

```bash
$ grunt build
```

## Deploying to Production

Change the host in the production inventory file `provisioning/production` and
execute the Ansible playbook against it:

```bash
$ ansible-playbook provisioning/production.yml -i provisioning/production
```

## Working with the [NUSMods API](https://github.com/nusmodifications/nusmods-api)

NUSMods is set up to work with the remote API at http://nusmods.com/api/ by
default. To work with a local copy of the API:

```bash
$ git submodule update --init
$ cd api
$ npm install
$ grunt
```

The development server serves the files generated in `api/app/api` under
`/api/`, so change `baseUrl` under `app/config/application.json` to point to
`/api/`.

## Optional Dependencies

- [PHP](http://www.php.net) for export, URL shortening, redirect and Facebook API proxy scripts.
- [YOURLS](http://yourls.org/) for URL shortening.
- [wkhtmltopdf and wkhtmltoimage](http://wkhtmltopdf.org/) for pdf
  and image export. Using the static binaries is suggested, as compiling with
  all the features of the static build needs a custom patched version of QT,
  which takes a *long* time to build.
- [Facebook PHP SDK](https://github.com/facebook/facebook-php-sdk-v4) for Facebook API proxy.
- To install the PHP dependencies, simply do:
```bash
$ composer install
```

## License

Copyright (c) 2016 NUS Modifications. Licensed under the MIT license.
