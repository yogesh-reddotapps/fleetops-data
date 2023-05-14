import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import { tracked } from '@glimmer/tracking';
import { computed, setProperties, set } from '@ember/object';
import { notEmpty, not, bool, alias, equal } from '@ember/object/computed';
import { isArray } from '@ember/array';
import { isBlank } from '@ember/utils';
import { getOwner } from '@ember/application';
import { capitalize, camelize } from '@ember/string';
import { format as formatDate, formatDistanceToNow, isValid as isValidDate } from 'date-fns';
import groupBy from '@fleetbase/ember-core/utils/macros/group-by';
import isRelationMissing from '@fleetbase/ember-core/utils/is-relation-missing';
import isNotModel from '@fleetbase/ember-core/utils/is-not-model';

export default class OrderModel extends Model {
    /** @ids */
    @attr('string') public_id;
    @attr('string') internal_id;
    @attr('string') company_uuid;
    @attr('string') transaction_uuid;
    @attr('string') customer_uuid;
    @attr('string') facilitator_uuid;
    @attr('string') payload_uuid;
    @attr('string') route_uuid;
    @attr('string') purchase_rate_uuid;
    @attr('string') tracking_number_uuid;
    @attr('string') driver_assigned_uuid;
    @attr('string') service_quote_uuid;
    @attr('string') payload_id;
    @attr('string') purchase_rate_id;
    @attr('string') driver_id;

    /** @relationships */
    @belongsTo('company') company;
    @belongsTo('customer', { polymorphic: true, async: true }) customer;
    @belongsTo('facilitator', { polymorphic: true, async: false }) facilitator;
    @belongsTo('transaction', { async: false }) transaction;
    @belongsTo('payload', { async: false }) payload;
    @belongsTo('driver', { async: false, inverse: 'jobs' }) driver_assigned;
    @belongsTo('route', { async: false }) route;
    @belongsTo('tracking-number', { async: false }) tracking_number;
    @belongsTo('order-config', { async: false }) order_config;
    @hasMany('tracking-status', { async: false }) tracking_statuses;

    /** @aliases */
    @alias('driver_assigned') driver;

    /** @attributes */
    @attr('string') tracking;
    @attr('string') meta;
    @attr('string') info;
    @attr('string') tracking;
    @attr('string') qr_code;
    @attr('string') pickup_name;
    @attr('string') dropoff_name;
    @attr('string') driver_name;
    @attr('string') customer_name;
    @attr('string') customer_type;
    @attr('string') facilitator_name;
    @attr('string') facilitator_type;
    @attr('string') created_by_name;
    @attr('string') updated_by_name;
    @attr('string') pod_method;
    @attr('string') type;
    @attr('string') status;
    @attr('number') adhoc_distance;
    @attr('number') total_entities;
    @attr('number') transaction_amount;
    @attr('boolean') has_driver_assigned;
    @attr('boolean') pod_required;
    @attr('boolean') dispatched;
    @attr('boolean') started;
    @attr('boolean') adhoc;
    @attr('boolean') is_route_optimized;
    @attr('boolean') customer_is_contact;
    @attr('boolean') customer_is_vendor;
    @attr('boolean') facilitator_is_contact;
    @attr('boolean') facilitator_is_vendor;
    @attr('raw') meta;
    @attr('raw') options;

    /** @dates */
    @attr('date') scheduled_at;
    @attr('date') dispatched_at;
    @attr('date') deleted_at;
    @attr('date') created_at;
    @attr('date') updated_at;

    /** @tracked */
    @tracked selected = false;

    /** @computed */
    @notEmpty('facilitator_uuid') has_facilitator;
    @notEmpty('customer_uuid') has_customer;
    @notEmpty('meta.integrated_vendor') isIntegratedVendorOrder;
    @notEmpty('tracking_number_uuid') has_tracking_number;
    @notEmpty('tracking_statuses') has_tracking_statuses;
    @notEmpty('payload_uuid') has_payload;
    @not('hasTrackingNumber') missing_tracking_number;
    @not('hasTrackingStatuses') missing_tracking_statuses;
    @not('hasPayload') missing_payload;
    @bool('dispatched') isDispatched;
    @not('dispatched') isNotDispatched;
    @equal('type', 'storefront') isStorefrontOrder;
    @groupBy('order_config.meta.fields', 'group') groupedMetaFields;

    @computed('payload.pickup.name', 'payload.current_waypoint_uuid', 'payload.waypoints.@each.name')
    get pickupName() {
        const { payload, meta } = this;

        if (payload?.pickup) {
            return payload.pickup.name ?? payload.pickup.street1;
        }

        if (payload?.currentWaypoint) {
            return payload.currentWaypoint.name ?? payload.currentWaypoint.street1;
        }

        if (payload?.waypoints.firstObject) {
            return payload.waypoints.firstObject.name ?? payload.waypoints.firstObject.street1;
        }

        if (meta.pickup_is_driver_location === true) {
            return 'Dynamic';
        }

        return 'None';
    }

    get dropoffName() {
        const { payload, meta } = this;

        if (payload?.dropoff) {
            return payload.dropoff.name ?? payload.dropoff.street1;
        }

        if (payload?.waypoints.lastObject) {
            return payload.waypoints.lastObject.name ?? payload.waypoints.lastObject.street1;
        }

        if (meta.pickup_is_driver_location === true) {
            return 'Dynamic';
        }

        return 'None';
    }

    @computed('public_id', 'scheduledAtTime') get eventTitle() {
        return `${this.scheduledAtTime} - ${this.public_id}`;
    }

    @computed('updated_at') get updatedAgo() {
        if (!this.updated_at) {
            return null;
        }

        return formatDistanceToNow(this.updated_at);
    }

    @computed('updated_at') get updatedAt() {
        if (!this.updated_at) {
            return null;
        }

        return formatDate(this.updated_at, 'PP HH:mm');
    }

    @computed('updated_at') get updatedAtShort() {
        if (!this.updated_at) {
            return null;
        }

        return formatDate(this.updated_at, 'PP');
    }

    @computed('created_at') get createdAgo() {
        if (!this.created_at) {
            return null;
        }

        return formatDistanceToNow(this.created_at);
    }

    @computed('created_at') get createdAt() {
        if (!this.created_at) {
            return null;
        }

        return formatDate(this.created_at, 'PP HH:mm');
    }

    @computed('created_at') get createdAtShort() {
        if (!this.created_at) {
            return null;
        }

        return formatDate(this.created_at, 'PP');
    }

    @computed('dispatched_at') get dispatchedAgo() {
        if (!this.dispatched_at) {
            return 'N/A';
        }

        return formatDistanceToNow(this.dispatched_at);
    }

    @computed('dispatched_at') get dispatchedAt() {
        if (!this.dispatched_at) {
            return 'N/A';
        }

        return formatDate(this.dispatched_at, 'PP  HH:mm');
    }

    @computed('dispatched_at') get dispatchedAtShort() {
        if (!this.dispatched_at) {
            return 'N/A';
        }

        return formatDate(this.dispatched_at, 'PP');
    }

    @computed('started_at') get startedAgo() {
        if (!this.started_at) {
            return 'N/A';
        }

        return formatDistanceToNow(this.started_at);
    }

    @computed('started_at') get startedAt() {
        if (!this.started_at) {
            return 'N/A';
        }

        return formatDate(this.started_at, 'PP HH:mm');
    }

    @computed('started_at') get startedAtShort() {
        if (!this.started_at) {
            return 'N/A';
        }

        return formatDate(this.started_at, 'PP');
    }

    @computed('scheduled_at') get scheduledAt() {
        if (!this.scheduled_at || !isValidDate(this.scheduled_at)) {
            return 'N/A';
        }

        return formatDate(this.scheduled_at, 'PP HH:mm');
    }

    @computed('scheduled_at') get scheduledAtTime() {
        if (!this.scheduled_at || !isValidDate(this.scheduled_at)) {
            return 'N/A';
        }

        return formatDate(this.scheduled_at, 'HH:mm');
    }

    @computed('created_at') get createdAtWithTime() {
        return formatDate(this.created_at, 'PP HH:mm');
    }

    @computed('created_at') get createdAtDetailed() {
        return formatDate(this.created_at, 'PP HH:mm');
    }

    // eslint-disable-next-line ember/use-brace-expansion
    @computed('payload.isMultiDrop', 'payload.waypoints.[]', 'payload.pickup_uuid', 'payload.dropoff_uuid')
    get isMultipleDropoffOrder() {
        return this.payload?.isMultiDrop;
    }

    @computed('has_driver_assigned', 'driver_assigned') get canLoadDriver() {
        return this.has_driver_assigned && !this.driver_assigned;
    }

    @computed('status', 'dispatched') get shouldDisplayDispatchLabel() {
        return this.dispatched === true && this.status !== 'canceled' && this.status !== 'completed' && this.status !== 'dispatched';
    }

    @computed('status', 'isNotDispatched', 'isIntegratedVendorOrder')
    get canBeDispatched() {
        return !this.isIntegratedVendorOrder && this.isNotDispatched && this.status !== 'canceled' && this.status !== 'completed' && this.status !== 'dispatched';
    }

    @equal('status', 'created') isFresh;
    @equal('status', 'preparing') isPreparing;
    @equal('status', 'completed') isCompleted;
    @equal('status', 'canceled') isCanceled;
    @equal('status', 'ready') isReady;

    @computed('status', 'meta.is_pickup') get isPickupReady() {
        return this.status === 'ready' && this?.meta?.is_pickup === true;
    }

    @computed('isCanceled', 'isCompleted') get activityHasEnded() {
        return this.isCanceled || this.isCompleted;
    }

    /** @methods */
    setPayload(payload = null) {
        if (isNotModel(payload)) {
            return this;
        }

        if (!payload.type) {
            payload.type = this.type;
        }

        setProperties(this, { payload });

        return this;
    }

    setRoute(route = null) {
        if (isNotModel(route)) {
            return this;
        }

        setProperties(this, { route });
        return this;
    }

    serializeMetaFromFields(metaFields = []) {
        if (!isArray(metaFields)) {
            return this;
        }

        const meta = {};

        for (let i = 0; i < metaFields.length; i++) {
            const metaField = metaFields[i];

            if (!metaField || !metaField.key) {
                continue;
            }

            meta[metaField.key] = metaField.value;
        }

        setProperties(this, { meta });

        return this;
    }

    serializeMetaFromGroupedFields(metaFields = []) {
        if (!isArray(metaFields)) {
            return this;
        }

        const meta = this.meta || {};

        for (let i = 0; i < metaFields.length; i++) {
            const metaGroup = metaFields.objectAt(i);

            if (!metaGroup || !isArray(metaGroup.items)) {
                continue;
            }

            for (let groupIndex = 0; groupIndex < metaGroup.items.length; groupIndex++) {
                const metaField = metaGroup.items.objectAt(groupIndex);

                if (!metaField || !metaField.key) {
                    continue;
                }

                meta[metaField.key] = metaField.value || null;
            }
        }

        setProperties(this, { meta });

        return this;
    }

    serializeMeta() {
        const { meta } = this;

        if (!isArray(meta)) {
            return this;
        }

        const serializedMeta = {};

        for (let i = 0; i < meta.length; i++) {
            const metaField = meta.objectAt(i);
            const { key, value } = metaField;

            if (!key) {
                continue;
            }

            set(serializedMeta, key, value);
        }

        setProperties(this, { meta: serializedMeta });

        return this;
    }

    async loadPayload(force = false) {
        const owner = getOwner(this);
        const store = owner.lookup(`service:store`);

        if (!this.payload_uuid || !isBlank(this.payload)) {
            return;
        }

        return store
            .queryRecord('payload', {
                uuid: this.payload_uuid,
                single: true,
                with: ['pickup', 'dropoff', 'return', 'waypoints', 'entities'],
            })
            .then((payload) => {
                this.set('payload', payload);
                return payload;
            });
    }

    async loadCustomer() {
        const owner = getOwner(this);
        const store = owner.lookup(`service:store`);

        if (!this.customer_uuid || !isBlank(this.customer)) {
            return;
        }

        return store.findRecord(`customer-${this.customer_type}`, this.customer_uuid).then((customer) => {
            this.set('customer', customer);
            return customer;
        });
    }

    async loadOrderConfig() {
        const owner = getOwner(this);
        const fetch = owner.lookup(`service:fetch`);

        if (!isBlank(this.order_config)) {
            return;
        }

        return fetch
            .get('fleet-ops/order-configs/get-installed', { key: this.type ?? 'default', single: true }, { normalizeToEmberData: true, normalizeModelType: 'order-config' })
            .then((orderConfig) => {
                this.set('order_config', orderConfig);
                return orderConfig;
            });
    }

    async loadDriver() {
        const owner = getOwner(this);
        const store = owner.lookup(`service:store`);

        if (!this.driver_assigned_uuid || !isBlank(this.driver_assigned)) {
            return;
        }

        return store.findRecord('driver', this.driver_assigned_uuid).then((driver) => {
            this.set('driver_assigned', driver);
            return driver;
        });
    }

    async loadTrackingNumber() {
        const owner = getOwner(this);
        const store = owner.lookup(`service:store`);

        if (!this.tracking_number_uuid || !isBlank(this.tracking_number)) {
            return;
        }

        return store.findRecord('tracking-number', this.tracking_number_uuid).then((trackingNumber) => {
            this.set('tracking_number', trackingNumber);
            return trackingNumber;
        });
    }

    async loadTrackingActivity() {
        const owner = getOwner(this);
        const store = owner.lookup(`service:store`);

        if (!this.tracking_number_uuid) {
            return;
        }

        return store
            .query('tracking-status', {
                tracking_number_uuid: this.tracking_number_uuid,
            })
            .then((activity) => {
                this.set('tracking_statuses', activity.toArray());
                return activity;
            });
    }
}
