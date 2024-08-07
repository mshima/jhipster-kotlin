#!/usr/bin/env bash

#-------------------------------------------------------------------------------
# Eg: 11-generate-config.sh ./ ng-default sqlfull
#-------------------------------------------------------------------------------
if [[ "$1" != "" ]]; then
    KHI_FOLDER_APP=$1
fi

if [[ "$2" != "" ]]; then
    JHI_APP=$2
fi

if [[ "$3" != "" ]]; then
    JHI_ENTITY=$3
fi

set -e
if [[ -a $(dirname $0)/00-init-env.sh ]]; then
    source $(dirname $0)/00-init-env.sh
else
    echo "*** 00-init-env.sh not found"
fi

#-------------------------------------------------------------------------------
# Functions
#-------------------------------------------------------------------------------
moveEntity() {
    local entity="$1"
    cp "$JHI_ENTITY_SAMPLES"/"$entity".json "$KHI_FOLDER_APP"/.jhipster/
}

prepareFolder() {
    cd "$KHI_HOME"
    rm -rf "$KHI_FOLDER_APP"
}
#-------------------------------------------------------------------------------
# Copy entities json
#-------------------------------------------------------------------------------

if [[ $KHI_REPO != "" ]]; then
    prepareFolder
fi

mkdir -p "$KHI_FOLDER_APP"/.jhipster/
cd "$KHI_FOLDER_APP"

if [[ "$JHI_ENTITY" != "jdl" && "$JHI_APP" != "jdl" ]]; then
    #-------------------------------------------------------------------------------
    # Copy jhipster config
    #-------------------------------------------------------------------------------
    if [[ -f "$JHI_SAMPLES"/"$JHI_APP"/.yo-rc.json ]]; then
        JHI_APP_SAMPLE_DIR="$JHI_SAMPLES"/"$JHI_APP"
    else
        JHI_APP_SAMPLE_DIR="$JHI_INTEG"/samples/"$JHI_APP"
    fi
    cp -f "$JHI_APP_SAMPLE_DIR"/.yo-rc.json "$KHI_FOLDER_APP"/
    echo "$JHI_APP: ($JHI_APP_SAMPLE_DIR)"
    ls -al "$KHI_FOLDER_APP"/
fi
if [[ ("$JHI_ENTITY" == "mongodb") || ("$JHI_ENTITY" == "couchbase") ]]; then
    moveEntity DocumentBankAccount
    moveEntity EmbeddedOperation
    moveEntity Place
    moveEntity Division

    moveEntity FieldTestEntity
    moveEntity FieldTestMapstructAndServiceClassEntity
    moveEntity FieldTestServiceClassAndJpaFilteringEntity
    moveEntity FieldTestServiceImplEntity
    moveEntity FieldTestInfiniteScrollEntity
    moveEntity FieldTestPaginationEntity

    moveEntity EntityWithDTO
    moveEntity EntityWithPaginationAndDTO
    moveEntity EntityWithServiceClassAndPagination
    moveEntity EntityWithServiceClassPaginationAndDTO
    moveEntity EntityWithServiceImplAndDTO
    moveEntity EntityWithServiceImplAndPagination
    moveEntity EntityWithServiceImplPaginationAndDTO

elif [[ "$JHI_ENTITY" == "neo4j" ]]; then
    moveEntity Album
    moveEntity Track
    moveEntity Genre
    moveEntity Artist

elif [[ "$JHI_ENTITY" == "cassandra" ]]; then
    moveEntity CassBankAccount

    moveEntity FieldTestEntity
    moveEntity FieldTestServiceImplEntity
    moveEntity FieldTestMapstructAndServiceClassEntity
    moveEntity FieldTestPaginationEntity

elif [[ "$JHI_ENTITY" == "micro" ]]; then
    moveEntity MicroserviceBankAccount
    moveEntity MicroserviceOperation
    moveEntity MicroserviceLabel

    moveEntity FieldTestEntity
    moveEntity FieldTestMapstructAndServiceClassEntity
    moveEntity FieldTestServiceClassAndJpaFilteringEntity
    moveEntity FieldTestServiceImplEntity
    moveEntity FieldTestInfiniteScrollEntity
    moveEntity FieldTestPaginationEntity

elif [[ "$JHI_ENTITY" == "sqllight" ]]; then
    moveEntity BankAccount
    moveEntity Label
    moveEntity Operation

elif [[ "$JHI_ENTITY" == "sqlfull" ]]; then
    moveEntity BankAccount
    moveEntity Label
    moveEntity Operation
    moveEntity Place
    moveEntity Division

    moveEntity FieldTestEntity
    moveEntity FieldTestMapstructAndServiceClassEntity
    moveEntity FieldTestServiceClassAndJpaFilteringEntity
    moveEntity FieldTestServiceImplEntity
    moveEntity FieldTestInfiniteScrollEntity
    moveEntity FieldTestPaginationEntity
    moveEntity FieldTestEnumWithValue

    moveEntity TestEntity
    moveEntity TestMapstruct
    moveEntity TestServiceClass
    moveEntity TestServiceImpl
    moveEntity TestInfiniteScroll
    moveEntity TestPagination
    moveEntity TestManyToOne
    moveEntity TestManyToMany
    moveEntity TestManyRelPaginDTO
    moveEntity TestOneToOne
    moveEntity TestCustomTableName
    moveEntity TestTwoRelationshipsSameEntity
    moveEntity SuperMegaLargeTestEntity

    moveEntity EntityWithDTO
    moveEntity EntityWithPaginationAndDTO
    moveEntity EntityWithServiceClassAndPagination
    moveEntity EntityWithServiceClassPaginationAndDTO
    moveEntity EntityWithServiceImplAndDTO
    moveEntity EntityWithServiceImplAndPagination
    moveEntity EntityWithServiceImplPaginationAndDTO

    moveEntity MapsIdParentEntityWithoutDTO
    moveEntity MapsIdChildEntityWithoutDTO
    moveEntity MapsIdGrandchildEntityWithoutDTO
    moveEntity MapsIdParentEntityWithDTO
    moveEntity MapsIdChildEntityWithDTO
    moveEntity MapsIdGrandchildEntityWithDTO
    moveEntity MapsIdUserProfileWithDTO

    moveEntity JpaFilteringRelationship
    moveEntity JpaFilteringOtherSide

elif [[ "$JHI_ENTITY" == "sql" ]]; then
    moveEntity BankAccount
    moveEntity Label
    moveEntity Operation

    moveEntity FieldTestEntity
    moveEntity FieldTestMapstructAndServiceClassEntity
    moveEntity FieldTestServiceClassAndJpaFilteringEntity
    moveEntity FieldTestServiceImplEntity
    moveEntity FieldTestInfiniteScrollEntity
    moveEntity FieldTestPaginationEntity
    moveEntity FieldTestEnumWithValue

    moveEntity EntityWithDTO
    moveEntity EntityWithPaginationAndDTO
    moveEntity EntityWithServiceClassAndPagination
    moveEntity EntityWithServiceClassPaginationAndDTO
    moveEntity EntityWithServiceImplAndDTO
    moveEntity EntityWithServiceImplAndPagination
    moveEntity EntityWithServiceImplPaginationAndDTO

    moveEntity MapsIdUserProfileWithDTO

elif [[ "$3" != "" ]]; then
    JHI_JDL_ENTITY=$3
fi

#-------------------------------------------------------------------------------
# Generate jdl entities
#-------------------------------------------------------------------------------
if [[ "$JHI_JDL_ENTITY" != "" && "$JHI_JDL_ENTITY" != "none" ]]; then
    IFS=','
    for i in `echo "$JHI_JDL_ENTITY"`
    do
        if [[ -d "$JHI_SAMPLES/jdl-entities/$i" ]]; then
            cli.cjs --no-insight jdl "$JHI_SAMPLES"/jdl-entities/$i --json-only

        elif [[ -f "$JHI_SAMPLES/jdl-entities/$i.jdl" ]]; then
            cp -f "$JHI_SAMPLES/jdl-entities/$i.jdl" "$KHI_FOLDER_APP"/
            cli.cjs --no-insight jdl "$JHI_SAMPLES"/jdl-entities/$i.jdl --json-only

        fi
    done
fi

#-------------------------------------------------------------------------------
# Print entities json
#-------------------------------------------------------------------------------
echo "*** Entities:"
ls -al "$KHI_FOLDER_APP"/.jhipster/

#-------------------------------------------------------------------------------
# Force no insight
#-------------------------------------------------------------------------------
if [ "$KHI_FOLDER_APP" == "$HOME/app" ]; then
    mkdir -p "$HOME"/.config/configstore/
    cp "$KHI_INTEG"/configstore/*.json "$HOME"/.config/configstore/
fi
