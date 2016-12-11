# Kibana Guard

Kibana Guard is a simple tool, that tries to add a multi-tenancy support into kibaba by adding suffixes to index names

## Preparation

You should configure your indexes in such way, that every index has same name + special suffix, that would be unique for a user
i.e. if index is called "mysuperindex" , and you have 2 users with suffixes "\_user1" and "\_user2", you need to create indexes called "mysuperindex_user1" and "mysuperindex_user2".
So, when Kibana will try to request data from mysuperindex -> kibana-guard will automatically get data from index mysuperindex_%suffix

### Kibana configuration

As Kibana stores all data in the ".kibana" index, you need to dump .kibaba index to the .kibana_%prefix 

You can use a elastic-dump tool for this needs
https://github.com/taskrabbit/elasticsearch-dump

npm install elasticdump -g

elasticdump --input=http://localhost:9200/.kibana --output=http://localhost:9200/.kibana_USER1 --type=mapping
elasticdump --input=http://localhost:9200/.kibana --output=http://localhost:9200/.kibana_USER1 --type=data


