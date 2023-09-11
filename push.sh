!/bin/bash

#
# Builds and publishes docker image
#
#

MYDIR=$(dirname $0)
perl -pi -e 'chomp' $MYDIR/VERSION
VERSION=$(cat $MYDIR/VERSION)
echo VERSION IS: $VERSION
ACCOUNT=931985504193
REPO=${ACCOUNT}.dkr.ecr.us-east-1.amazonaws.com/sprinklr-gateway

if [ $(docker-machine status) = "Stopped" ]; then
    echo starting up docker
    docker-machine start
    STARTED=1
fi
source $(docker-machine env)

echo ==================
echo logging in
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${ACCOUNT}.dkr.ecr.us-east-1.amazonaws.com
# $(aws ecr get-login --no-include-email --region us-east-1)

echo ==================
echo Building Docker image
docker build . -t $REPO:$VERSION -t $REPO:latest || exit 1

echo ==================
echo Publishin docker image to repo
docker push $REPO:$VERSION || exit 2

echo ==================
echo commitando e tagueando no git como versao $VERSION
git commit -a -m "Version bump to ${VERSION}"
git tag $VERSION
git push --tags
git push
if [ "$STARTED" = "1" ]; then
    docker-machine stop
fi
