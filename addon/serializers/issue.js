import ApplicationSerializer from '@fleetbase/ember-core/serializers/application';
import { EmbeddedRecordsMixin } from '@ember-data/serializer/rest';

export default class IssueSerializer extends ApplicationSerializer.extend(EmbeddedRecordsMixin) {
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
            assignee: { embedded: 'always' },
        };
    }
}
