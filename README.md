# Kibana Guard

Kibana Guard is a simple tool, that tries to add a multi-tenancy support into kibaba by adding suffixes to index names

## Preparation

You should configure your indexes in such way, that every index has same name + special suffix, that would be unique for a user
i.e. if index is called "mysuperindex" , and you have 2 users with suffixes "\_user1" and "\_user2", you need to create indexes called "mysuperindex_user1" and "mysuperindex_user2".
So, when Kibana will try to request data from mysuperindex -> kibana-guard will automatically get data from index mysuperindex_%suffix

### Install local redis instance !!!

Probably as easy as apt-get install redis-server

### Kibana configuration

#### Prepare Kibana index
As Kibana stores all data in the ".kibana" index, you need to dump .kibaba index to the .kibana_%prefix , if you wouldnt do it - kibana will create an empty index

You can use a elastic-dump tool for this needs
https://github.com/taskrabbit/elasticsearch-dump

npm install elasticdump -g

elasticdump --input=http://localhost:9200/.kibana --output=http://localhost:9200/.kibana_USER1 --type=mapping
elasticdump --input=http://localhost:9200/.kibana --output=http://localhost:9200/.kibana_USER1 --type=data

#### Prepare extra instance of Kibana

##### Prepare init.d script

Take a look on contrib/init.d/kibana_instance file. This is an init.d file, that should be placed in the /etc/init.d/ folder of your system, if you are running systems, that support init.d,
or you need to rewrite this script according to your system rules.
Main idea of this script is to run kibana with separate config file. You need to replace placeholder "kibana_PREFIX" with the desired name, where name equals to the name of config 
file in the /opt/kibana/config filder without the ".yml" extension
Dont forget to add your newly created script to autoload using update-rc.d NEW_SCRIPT_NAME defaults

##### Prepare config file

Depending on your installation, you need to find a place, where Kibana store it's config, i.e /opt/kibana/config folder.
In that folder you need to find config file, and make a copy of it with the name , equal to the NAME variable in the init.d script without the ".yml" extension
In the newly created config file you need to change only 2 params :

* server.port - set it to a port on which new Kibana instance will listen for requests
* kibana.index - set it to an newly prepared Kibana Index

##### Prepare nginx config

Take a look on contrib/nginx/kibana_instance file, this is a sample config that you need to put into your nginx /etc/init.d/sites-available folder.
Dont forget to enable reading of configs from that folder, and if you are using sites-enables folder - make a corresponding symlynk

In newly created nginx config replace 2 params:

* PROXY_PORT - to a port, on which NGINX will listen
* KIBANA_PORT - to a port, on which new Kibana instance listens for new requests

### Prepare config.json file
While config is self-explanatory , here are 2 things, that need to be possible changed

* replaceableIndexes - index, that kibana-guard will replace, this means that user will not get an access to this indexes directly, format : INDEX-*, as part before "-\*" will be actually replaced
* users section - set elk_host to the NGINX address + port , and prefix to a value, that would be added to replaced index name

### Last checks

* Check, that nginx config is created, and nginx sees that config
* Check, that kibana init.d script is created and added to autorun
* Check, that kibana config is created
* Check, that kibana index is created
* Execute /etc/init.d/NEW_KIBANA_SCRIPT restart , and check that new instance is actually running
* Check , that users are added to a config.json file with correct settings

