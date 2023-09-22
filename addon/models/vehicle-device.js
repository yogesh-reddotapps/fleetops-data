import Model, { attr, belongsTo } from '@ember-data/model';

export default class VehicleDeviceModel extends Model {
    @attr('string') uuid;
    @attr('string') photo_uuid;
    @attr('string') device_type;
    @attr('string') device_name;
    @attr('string') device_model;
    @attr('string') manufacturer;
    @attr('string') serial_number;
    @attr('date') installation_date;
    @attr('date') last_maintenance_date;
    @attr('raw') meta;
    @attr('string') status;
    @attr('string') data_frequency;
    @attr('string') notes;
    @belongsTo('vehicle', { async: false }) vehicle;
}
