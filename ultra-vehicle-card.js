import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module";
import { UltraVehicleCardEditor } from "./ultra-vehicle-card-editor.js";
import { styles } from "./styles.js";


const version = "V1.2.3";


class UltraVehicleCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
    };
  }

 static get version() {
    return version;
  }

  static get styles() {
  return [styles];
}

  setConfig(config) {
    if (!config.title) {
      throw new Error("You need to define a title");
    }
    this.config = {
      title: "My Vehicle",
      image_url: "",
    charging_image_url: "",
      vehicle_type: "EV",
      unit_type: "mi",
      battery_level_entity: "",
      battery_range_entity: "",
      fuel_level_entity: "",
      fuel_range_entity: "",
      charging_status_entity: "",
      location_entity: "",
      mileage_entity: "",
      show_battery: true,
      show_battery_range: true,
      show_fuel: true,
      show_fuel_range: true,
      show_location: true,
      show_mileage: true,
      show_car_state: true,
      show_charge_limit: true,
      icon_grid_entities: [],
      custom_icons: {},
      icon_interactions: {},
      icon_styles: {},
      hybrid_display_order: 'fuel_first',
      car_state_entity: "",
      charge_limit_entity: "",
      cardBackgroundColor: "",
      barBackgroundColor: "",
      barFillColor: "",
      limitIndicatorColor: "",
      iconActiveColor: "",
      iconInactiveColor: "",
      barBorderColor: "",
      icon_size: 24,
      icon_gap: 12,
    ...config
    };
    // Handle backward compatibility for entity names
if (this.config.level_entity && !this.config.battery_level_entity) {
  this.config.battery_level_entity = this.config.level_entity;
}
if (this.config.range_entity && !this.config.battery_range_entity) {
  this.config.battery_range_entity = this.config.range_entity;
}
  }

  render() {
    if (!this.hass || !this.config) {
      return html``;
    }

    return html`
        <ha-card style="background-color: var(--uvc-card-background);">
      <div class="vehicle-card-content">
        ${this._renderHeader()}
        ${this._renderCarState()}
        ${this._renderVehicleImage()}
        <div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
          ${this._renderIconGrid()}
        </div>
        ${this._renderVehicleInfo()}
      </div>
    </ha-card>
    `;
  }

_renderVehicleInfo() {
  const { vehicle_type } = this.config;
  
  switch(vehicle_type) {
    case 'EV':
      return this._renderEVInfo();
    case 'Fuel':
      return this._renderFuelInfo();
    case 'Hybrid':
      return this._renderHybridInfo();
    default:
      return html`<div class="error">Invalid vehicle type</div>`;
  }
}

_renderEVInfo() {
  const batteryLevelEntity = this.config.battery_level_entity ? this.hass.states[this.config.battery_level_entity] : null;
  const batteryRangeEntity = this.config.battery_range_entity ? this.hass.states[this.config.battery_range_entity] : null;
  const chargingStatusEntity = this.config.charging_status_entity ? this.hass.states[this.config.charging_status_entity] : null;
  const chargeLimitEntity = this.config.charge_limit_entity ? this.hass.states[this.config.charge_limit_entity] : null;

  // Round the battery level to the nearest integer
  const batteryLevel = batteryLevelEntity ? Math.round(parseFloat(batteryLevelEntity.state)) : null;
  const batteryRange = batteryRangeEntity ? Math.round(parseFloat(batteryRangeEntity.state)) : null;
  const isCharging = this._isCharging(chargingStatusEntity);
  const chargeLimit = chargeLimitEntity && this.config.show_charge_limit ? Math.round(parseFloat(chargeLimitEntity.state)) : null;

  return html`
    <div class="level-info">
      ${this.config.show_battery && batteryLevel !== null ? html`
        <div class="item_bar">
          <div class="progress ${isCharging ? 'charging' : ''}" style="width: ${batteryLevel}%;"></div>
          ${chargeLimit !== null ? html`
            <div class="charge-limit-indicator" style="left: ${chargeLimit}%;"></div>
          ` : ''}
        </div>
        <div class="level-text">
          <span>${batteryLevel}% ${isCharging ? 'Charging' : 'Charge'}</span>
          ${this.config.show_battery_range && batteryRange !== null ? html`
            <span class="range">${batteryRange} ${this.config.unit_type}</span>
          ` : ''}
        </div>
      ` : this.config.show_battery_range && batteryRange !== null ? html`
        <div class="level-text">
          <span class="range" style="float: right;">${batteryRange} ${this.config.unit_type}</span>
        </div>
      ` : ''}
    </div>
  `;
}
  
  _isCharging(chargingStatusEntity) {
    if (!chargingStatusEntity) return false;
  
    const state = chargingStatusEntity.state.toLowerCase();
    const entityId = chargingStatusEntity.entity_id.toLowerCase();
  
    // Special handling for 'none_charging' entities
    if (entityId.includes('none_charging')) {
      return state === 'on';  // 'on' means charging for this specific entity
    }
  
    // Handle boolean entities
    if (chargingStatusEntity.attributes.device_class === 'battery_charging' || ['on', 'off'].includes(state)) {
      return state === 'on';
    }
  
    // Handle string-based entities
    const chargingStates = ['charging', 'in_charging', 'charge_start', 'in_progress', 'active', 'connected'];
    return chargingStates.includes(state);
  }


_formatBinarySensorState(state, attributes) {
  if (state === 'on') {
    return attributes.device_class ? this._capitalizeFirstLetter(attributes.device_class) : 'On';
  } else if (state === 'off') {
    return attributes.device_class ? `Not ${this._capitalizeFirstLetter(attributes.device_class)}` : 'Off';
  }
  return this._capitalizeFirstLetter(state);
}

_renderFuelInfo() {
  const fuelLevelEntity = this.config.fuel_level_entity ? this.hass.states[this.config.fuel_level_entity] : null;
  const fuelRangeEntity = this.config.fuel_range_entity ? this.hass.states[this.config.fuel_range_entity] : null;

  const fuelLevel = fuelLevelEntity ? parseFloat(fuelLevelEntity.state) : null;
  const fuelRange = fuelRangeEntity ? Math.round(parseFloat(fuelRangeEntity.state)) : null;

  return html`
    <div class="level-info">
      ${this.config.show_fuel && fuelLevel !== null ? html`
        <div class="item_bar">
          <div class="progress" style="width: ${fuelLevel}%;"></div>
        </div>
        <div class="level-text">
          <span>${fuelLevel}% Fuel</span>
          ${this.config.show_fuel_range && fuelRange !== null ? html`
            <span class="range">${fuelRange} ${this.config.unit_type}</span>
          ` : ''}
        </div>
      ` : this.config.show_fuel_range && fuelRange !== null ? html`
        <div class="level-text">
          <span class="range" style="float: right;">${fuelRange} ${this.config.unit_type}</span>
        </div>
      ` : ''}
    </div>
  `;
}

_renderHybridInfo() {
  const batteryLevelEntity = this.config.battery_level_entity ? this.hass.states[this.config.battery_level_entity] : null;
  const batteryRangeEntity = this.config.battery_range_entity ? this.hass.states[this.config.battery_range_entity] : null;
  const fuelLevelEntity = this.config.fuel_level_entity ? this.hass.states[this.config.fuel_level_entity] : null;
  const fuelRangeEntity = this.config.fuel_range_entity ? this.hass.states[this.config.fuel_range_entity] : null;
  const chargingStatusEntity = this.config.charging_status_entity ? this.hass.states[this.config.charging_status_entity] : null;
  const chargeLimitEntity = this.config.charge_limit_entity ? this.hass.states[this.config.charge_limit_entity] : null;

  const batteryLevel = batteryLevelEntity ? parseFloat(batteryLevelEntity.state) : null;
  const batteryRange = batteryRangeEntity ? Math.round(parseFloat(batteryRangeEntity.state)) : null;
  const fuelLevel = fuelLevelEntity ? parseFloat(fuelLevelEntity.state) : null;
  const fuelRange = fuelRangeEntity ? Math.round(parseFloat(fuelRangeEntity.state)) : null;
  const isCharging = this._isCharging(chargingStatusEntity);
  const chargeLimit = chargeLimitEntity && this.config.show_charge_limit ? parseFloat(chargeLimitEntity.state) : null;
  

  const batteryFirst = this.config.hybrid_display_order === 'battery_first';

  return html`
    <div class="level-info hybrid">
      ${batteryFirst ? html`
        ${this._renderBatteryBar(batteryLevel, batteryRange, isCharging, chargeLimit)}
        <div class="hybrid-separator"></div>
        ${this._renderFuelBar(fuelLevel, fuelRange)}
      ` : html`
        ${this._renderFuelBar(fuelLevel, fuelRange)}
        <div class="hybrid-separator"></div>
        ${this._renderBatteryBar(batteryLevel, batteryRange, isCharging, chargeLimit)}
      `}
    </div>
  `;
}

 _renderBatteryBar(level, range, isCharging, chargeLimit) {
  return html`
    ${this.config.show_battery && level !== null ? html`
      <div class="item_bar">
        <div class="progress ${isCharging ? 'charging' : ''}" style="width: ${level}%;"></div>
        ${chargeLimit !== null ? html`
          <div class="charge-limit-indicator" style="left: ${chargeLimit}%;"></div>
        ` : ''}
      </div>
      <div class="level-text">
        <span>${level}% ${isCharging ? 'Charging' : 'Charge'}</span>
        ${this.config.show_battery_range && range !== null ? html`
          <span class="range">${range} ${this.config.unit_type}</span>
        ` : ''}
      </div>
    ` : this.config.show_battery_range && range !== null ? html`
      <div class="level-text">
        <span class="range" style="float: right;">${range} ${this.config.unit_type}</span>
      </div>
    ` : ''}
  `;
}

  _renderFuelBar(level, range) {
    return html`
      ${this.config.show_fuel && level !== null ? html`
        <div class="item_bar">
          <div class="progress" style="width: ${level}%;"></div>
        </div>
        <div class="level-text">
          <span>${level}% Fuel</span>
          ${this.config.show_fuel_range && range !== null ? html`
            <span class="range">${range} ${this.config.unit_type}</span>
          ` : ''}
        </div>
      ` : this.config.show_fuel_range && range !== null ? html`
        <div class="level-text">
          <span class="range" style="float: right;">${range} ${this.config.unit_type}</span>
        </div>
      ` : ''}
    `;
  }

  _renderHeader() {
    return html`
       <h2 class="vehicle-name">${this.config.title}</h2>
    ${this._renderInfoLine()}
    `;
  }

_renderCarState() {
  if (!this.config.show_car_state || !this.config.car_state_entity) return '';

  const carStateEntity = this.hass.states[this.config.car_state_entity];
  if (!carStateEntity) return '';


  const state = this._formatCarState(carStateEntity.state, carStateEntity.attributes);

  return html`
    <div class="car-state" style="text-align: center; margin-bottom: 8px;">
      <span class="state-value">${state}</span>
    </div>
  `;
}
_formatCarState(state, attributes) {
  // Check if this is a timestamp sensor (like the charging end time)
  if (attributes.device_class === 'timestamp') {
    return this._formatChargingEndTime(state);
  }

  const knownStates = {
    'default': 'Ready',
    'charging': 'Charging',
    'error': 'Error',
    'complete': 'Charging Complete',
    'fully_charged': 'Fully Charged',
    'finished_fully_charged': 'Finished - Fully Charged',
    'finished_not_full': 'Finished - Not Full',
    'invalid': 'Invalid State',
    'not_charging': 'Not Charging',
    'plugged_in': 'Plugged In',
    'waiting_for_charging': 'Waiting to Charge',
    'target_reached': 'Target Reached',
    'on': 'On',
    'off': 'Off',
    'unavailable': 'Unavailable',
    'unknown': 'Unknown',
    'idle': 'Idle',
    'running': 'Running',
    'stopped': 'Stopped'
  };

  // Handle binary sensors
  if (this.config.car_state_entity.includes('binary_sensor')) {
    return this._formatBinarySensorState(state, attributes);
  }

  // Check if the state is a known state
  if (knownStates[state.toLowerCase()]) {
    return knownStates[state.toLowerCase()];
  }

  // Check for additional attributes
  if (attributes) {
    if (attributes.battery_level) {
      return `Battery ${attributes.battery_level}%`;
    }
    if (attributes.charge_limit) {
      return `Charge Limit ${attributes.charge_limit}%`;
    }
    if (attributes.charging_power) {
      return `Charging at ${attributes.charging_power} kW`;
    }
    if (attributes.range) {
      return `Range ${attributes.range} ${this.config.unit_type}`;
    }
    if (attributes.fuel_level) {
      return `Fuel ${attributes.fuel_level}%`;
    }
  }

  // If it's not a known state or attribute, capitalize each word
  return state.toString().toLowerCase().split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

_formatChargingEndTime(isoString) {
  const endTime = new Date(isoString);
  const now = new Date();

  // Check if the date is valid
  if (isNaN(endTime.getTime())) {
    return `Charging end time: ${isoString}`; // Fallback to display the original string
  }

  const diffMs = endTime - now;
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (diffMinutes <= 0) {
    return "Charging ending soon";
  } else if (diffMinutes < 60) {
    return `Charging ending in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
  } else if (diffHours < 24) {
    return `Charging ending in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  } else {
    const options = { weekday: 'short', hour: 'numeric', minute: 'numeric' };
    return `Charging until ${endTime.toLocaleString(undefined, options)}`;
  }
}

_renderInfoLine() {
  const locationEntity = this.config.location_entity ? this.hass.states[this.config.location_entity] : null;
  let location = null;

  if (locationEntity) {
    if (locationEntity.state.toLowerCase() === 'not_home') {
      location = 'Not Home';
    } else if (locationEntity.state === 'home') {
      location = 'Home';
    } else {
      // For custom locations, use the friendly name if available, otherwise use the state
      location = locationEntity.attributes.friendly_name || this._capitalizeFirstLetter(locationEntity.state);
    }
  }

  const mileageEntity = this.config.mileage_entity ? this.hass.states[this.config.mileage_entity] : null;
  let mileage = mileageEntity ? parseFloat(mileageEntity.state) : null;
  mileage = mileage !== null ? Math.round(mileage).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : null;

  if (!this.config.show_location && !this.config.show_mileage) return '';

  const infoTextColor = `var(--uvc-info-text-color, var(--secondary-text-color))`;

  return html`
    <div class="info-line" style="color: ${infoTextColor};">
      ${this.config.show_location && location ? html`
        <span class="location">
          <ha-icon icon="mdi:map-marker" style="color: ${infoTextColor};"></ha-icon>
          ${location}
        </span>
      ` : ''}
      ${this.config.show_mileage && mileage ? html`
        <span class="mileage">
          <ha-icon icon="mdi:speedometer" style="color: ${infoTextColor};"></ha-icon>
          ${mileage} ${this.config.unit_type}
        </span>
      ` : ''}
    </div>
  `;
}

_renderVehicleImage() {
  const chargingStatusEntity = this.config.charging_status_entity ? this.hass.states[this.config.charging_status_entity] : null;
  const isCharging = this._isCharging(chargingStatusEntity);
  const imageUrl = isCharging && this.config.charging_image_url
    ? this.config.charging_image_url
    : this.config.image_url;

  if (!imageUrl) return '';

  return html`
    <div class="vehicle-image-container">
      <img class="vehicle-image" src="${imageUrl}" alt="Vehicle Image">
    </div>
  `;
}

  _renderIconGrid() {
    const { icon_grid_entities } = this.config;
  
    if (!icon_grid_entities || icon_grid_entities.length === 0) {
      return '';
    }
  
    return html`
      <div class="icon-grid">
        ${icon_grid_entities.map(entityId => this._renderIconItem(entityId))}
      </div>
    `;
  }
  
  _renderIconItem(entityId) {
    if (!this.hass || !this.hass.states || !this.hass.states[entityId]) {
      return html``;
    }
  
    const entity = this.hass.states[entityId];
    const customIcon = this.config.custom_icons && this.config.custom_icons[entityId] ? this.config.custom_icons[entityId] : {};
    const defaultIcon = entity.attributes.icon;
    const state = entity.state;
    const isActive = ['on', 'open', 'true', 'unlocked'].includes(state.toLowerCase());
    const useActiveColor = customIcon.useActiveColor !== false;
    
    const icon = isActive
      ? (customIcon.active || defaultIcon || 'mdi:help-circle')
      : (customIcon.inactive || defaultIcon || 'mdi:help-circle');
    
    const iconColor = isActive && useActiveColor ? 'var(--uvc-icon-active)' : 'var(--uvc-icon-inactive)';
    const interaction = this.config.icon_interactions && this.config.icon_interactions[entityId] ? this.config.icon_interactions[entityId] : { type: 'more-info' };
    const buttonStyle = this.config.icon_styles && this.config.icon_styles[entityId] ? this.config.icon_styles[entityId] : 'icon';
  
    const isClickable = interaction.type !== 'none';
    const classes = `icon-item ${buttonStyle} ${isClickable ? 'clickable' : 'non-interactive'}`;
  
    return html`
      <div class="${classes}" @click="${() => this._handleIconClick(entityId, interaction)}">
        <ha-icon 
          .icon="${icon}" 
          style="color: ${iconColor}; width: var(--uvc-icon-grid-size); height: var(--uvc-icon-grid-size);"
        ></ha-icon>
      </div>
    `;
  }

updated(changedProperties) {
  super.updated(changedProperties);
  if (changedProperties.has('config')) {
    this.style.setProperty('--mdc-icon-size', `${this.config.icon_size}px`);
  }
}
_updateIconSize() {
  this.style.setProperty('--mdc-icon-size', `${this.config.icon_size}px`);
}

_handleIconClick(entityId, interaction) {
  switch (interaction.type) {
     case 'more-info':
      this._fireEvent('hass-more-info', { entityId });
      break;
    case 'toggle':
      this.hass.callService('homeassistant', 'toggle', { entity_id: entityId });
      break;
    case 'navigate':
      this._navigate(interaction.path);
      break;
    case 'url':
      this._openUrl(interaction.url);
      break;
    case 'call-service':
      this._callService(interaction.service, entityId);
      break;
     case 'assist':
      this._openAssistant(interaction.assistant, interaction.startListening);
      break;
    case 'none':
      // Do nothing
      break;
  }
}
_fireEvent(type, detail) {
  const event = new Event(type, {
    bubbles: true,
    composed: true,
    cancelable: false,
  });
  event.detail = detail;
  this.dispatchEvent(event);
}
_navigate(path) {
  history.pushState(null, "", path);
  const event = new Event('location-changed', {
    bubbles: true,
    composed: true,
  });
  this.dispatchEvent(event);
}

_openUrl(url) {
  window.open(url, '_blank');
}

_callService(service, entityId) {
  const [domain, serviceAction] = service.split('.');
  this.hass.callService(domain, serviceAction, { entity_id: entityId });
}

_openAssistant(assistantId, startListening) {
  this._fireEvent('show-dialog', {
    dialogTag: 'dialog-voice-command',
    dialogImport: () => import('../../dialogs/dialog-voice-command'),
    dialogParams: {
      assistantId: assistantId,
      startListening: startListening,
    },
  });
}

_showMoreInfo(entityId) {
  const event = new Event('hass-more-info', {
    bubbles: true,
    composed: true,
  });
  event.detail = { entityId };
  this.dispatchEvent(event);
}

_toggleEntity(entityId) {
  this.hass.callService('homeassistant', 'toggle', {
    entity_id: entityId,
  });
}
  _capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  static getConfigElement() {
    return document.createElement("ultra-vehicle-card-editor");
  }

  static getStubConfig() {
    return {
      title: "My Vehicle",
      image_url: "",
      vehicle_type: "EV",
      unit_type: "mi",
      battery_level_entity: "",
      battery_range_entity: "",
      fuel_level_entity: "",
      fuel_range_entity: "",
      charging_status_entity: "",
      location_entity: "",
      mileage_entity: "",
      show_battery: true,
      show_battery_range: true,
      show_fuel: true,
      show_fuel_range: true,
      show_location: true,
      show_mileage: true,
      icon_grid_entities: [],
      custom_icons: {},
      hybrid_display_order: 'fuel_first',
      car_state_entity: "",
      charge_limit_entity: "",
      show_car_state: true,
      show_charge_limit: true,
      cardBackgroundColor: "",
      barBackgroundColor: "",
      barFillColor: "",
      limitIndicatorColor: "",
      iconActiveColor: "",
      iconInactiveColor: ""
    };
  }

updated(changedProps) {
    super.updated(changedProps);
    if (changedProps.has('config') || changedProps.has('hass')) {
      const style = getComputedStyle(this);
      const primaryColor = style.getPropertyValue('--primary-color').trim();
      
      this.style.setProperty('--uvc-primary-color', this.config.barFillColor || primaryColor);
      this.style.setProperty('--uvc-card-background', this.config.cardBackgroundColor || style.getPropertyValue('--card-background-color').trim());
      this.style.setProperty('--uvc-bar-background', this.config.barBackgroundColor || '#595959');
      this.style.setProperty('--uvc-bar-border-color', this.config.barBorderColor || '#595959');
      this.style.setProperty('--uvc-limit-indicator', this.config.limitIndicatorColor || 'white');
      this.style.setProperty('--uvc-icon-active', this.config.iconActiveColor || primaryColor);
      this.style.setProperty('--uvc-icon-inactive', this.config.iconInactiveColor || style.getPropertyValue('--secondary-text-color').trim());
      this.style.setProperty('--uvc-info-text-color', this.config.infoTextColor || style.getPropertyValue('--secondary-text-color').trim());
      this.style.setProperty('--uvc-icon-grid-size', `${this.config.icon_size}px`);
      this.style.setProperty('--mdc-icon-size', `${this.config.icon_size}px`);
      this.style.setProperty('--uvc-icon-grid-gap', `${this.config.icon_gap}px`);
    }
  }
  }

customElements.define("ultra-vehicle-card", UltraVehicleCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ultra-vehicle-card",
  name: "Ultra Vehicle Card",
  description: "A card that displays vehicle information with fuel/charge level, range, location, mileage, and a customizable icon grid.",
  preview: true,
  documentationURL: "https://github.com/YOUR_USERNAME/ultra-vehicle-card",
  version: version
});

// Add this code to log the version in the console with custom styling
console.info(
  `%c Ultra Vehicle Card%c 🚗 ${version} `,
  'background-color: #4299D9;color: #fff;padding: 3px 2px 3px 3px;border-radius: 14px 0 0 14px;font-family: DejaVu Sans,Verdana,Geneva,sans-serif;text-shadow: 0 1px 0 rgba(1, 1, 1, 0.3)',
  'background-color: #4299D9;color: #fff;padding: 3px 3px 3px 2px;border-radius: 0 14px 14px 0;font-family: DejaVu Sans,Verdana,Geneva,sans-serif;text-shadow: 0 1px 0 rgba(1, 1, 1, 0.3)'
);

// Add this code to style the card in the browser console
const style = document.createElement('style');
style.textContent = `
  #current_version_ultra-vehicle-card {
    background-color: #4299D9 !important;
    color: white !important;
    padding: 2px 6px;
    border-radius: 4px;
    margin-left: 4px;
  }
`;
document.head.appendChild(style);
