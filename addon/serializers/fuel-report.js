import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';
import { get } from '@ember/object';
import { isNone } from '@ember/utils';

export default class FuelReportSerializer extends ApplicationSerializer.extend(EmbeddedRecordsMixin) {
    /**
     * Embedded relationship attributes
     *
     * @var {Object}
     */
    get attrs() {
        return {
            driver: { embedded: 'always' },
            vehicle: { embedded: 'always' },
            reporter: { embedded: 'always' },
        };
    }

    /**
     * Customize serializer so that any attributes that are instances of Models or objects
     * that are to accept and ID get serialized into the id only
     *
     * @param {Snapshot} snapshot
     * @param {Object} options
     * @return {Object} json
     */
    serialize(snapshot) {
        const json = super.serialize(...arguments);

        // for each relationship make sure the id is set
        snapshot.eachRelationship((key, relationship) => {
            const { kind } = relationship.meta;

            if (kind === 'belongsTo') {
                const relationSnapshot = snapshot.belongsTo(key);

                key = this.keyForRelationship ? this.keyForRelationship(key, 'belongsTo', 'serialize') : key;

                if (isNone(relationSnapshot)) {
                    return;
                }

                if (key === 'reporter') {
                    json['reported_by_uuid'] = get(json, `${key}.uuid`);
                    delete json.reporter;
                    return;
                }

                json[`${key}_uuid`] = relationSnapshot.id;
            }
        });

        return json;
    }
}
