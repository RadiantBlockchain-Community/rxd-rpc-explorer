### Setup of bch-rpc-explorer on Ubuntu 18.04 server

    sudo add-apt-repository ppa:certbot/certbot
    curl -sSL https://deb.nodesource.com/gpgkey/nodesource.gpg.key | sudo apt-key add -
    VERSION=node_10.x
    DISTRO="$(lsb_release -s -c)"
    echo "deb https://deb.nodesource.com/$VERSION $DISTRO main" | sudo tee /etc/apt/sources.list.d/nodesource.list
    echo "deb-src https://deb.nodesource.com/$VERSION $DISTRO main" | sudo tee -a /etc/apt/sources.list.d/nodesource.list
    sudo apt update
    sudo apt upgrade
    sudo apt install git software-properties-common nginx gcc g++ make nodejs
    sudo npm install pm2 --global
    apt install python-certbot-nginx

Copy content from [./bch-explorer.conf](./bch-explorer.conf) into `/etc/nginx/sites-available/bch-explorer.conf`

    certbot --nginx -d bch-explorer.com #use your domain name here
    cd /home/bitcoin
    git clone https://github.com/sickpig/bch-rpc-explorer.git
    cd /home/bitcoin/bch-rpc-explorer
    npm install
    pm2 start bin/www --name "bch-rpc-explorer"

If you want your explorer being able to show transactions with a feerate lower than 1 sat/byte you should
configure your full nodes to accept those on its mempool. To do that if you are using RXD unlimited you should
add this setting to `bitcoin.conf`

    minlimitertxfee=0.5

If you are using RXDN you have to use this parameter instead:

    minrelaytxfee=500

This would let your node to accept transactions in its mempool with a feerate as low as 0.5 sat/byte.
You can of course go lower than that at the expense of using more resource to bookkeep the mempool.
