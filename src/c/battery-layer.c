#include <pebble.h>
#include <pebble-events/pebble-events.h>
#include "logging.h"
#include "battery-layer.h"

typedef struct {
    BatteryChargeState charge_state;
    EventHandle battery_state_event_handle;
} Data;

static void prv_update_proc(BatteryLayer *this, GContext *ctx) {
    logf();
    GRect bounds = layer_get_bounds(this);
    Data *data = layer_get_data(this);

    GDrawCommandImage *pdc = gdraw_command_image_create_with_resource(RESOURCE_ID_PDC_BATTERY);
    if (data->charge_state.is_charging) {
        GDrawCommandList *list = gdraw_command_image_get_command_list(pdc);
        gdraw_command_set_hidden(gdraw_command_list_get_command(list, 2), false);
    }

    gdraw_command_image_draw(ctx, pdc, GPoint(2, 2));
    gdraw_command_image_destroy(pdc);

    GFont font = fonts_get_system_font(FONT_KEY_GOTHIC_14_BOLD);
    char s[4];

    if (data->charge_state.is_charging) {
        snprintf(s, sizeof(s), "CHG");
    } else {
        uint h = 30 * data->charge_state.charge_percent / 100;
        graphics_context_set_fill_color(ctx, GColorBlack);
        graphics_fill_rect(ctx, GRect(6, 8 + (30 - h), 18, h), 0, GCornerNone);

        snprintf(s, sizeof(s), "%d%%", data->charge_state.charge_percent);
    }

    graphics_context_set_text_color(ctx, GColorBlack);
    graphics_draw_text(ctx, s, font, GRect(0, 40, bounds.size.w, bounds.size.h), GTextOverflowModeFill, GTextAlignmentCenter, NULL);
}

static void prv_battery_state_handler(BatteryChargeState charge_state, void *this) {
    logf();
    Data *data = layer_get_data(this);
    memcpy(&data->charge_state, &charge_state, sizeof(BatteryChargeState));
    if (data->charge_state.charge_percent == 0) data->charge_state.charge_percent = 5;
    layer_mark_dirty(this);
}

BatteryLayer *battery_layer_create(GRect frame) {
    logf();
    BatteryLayer *this = layer_create_with_data(frame, sizeof(Data));
    layer_set_update_proc(this, prv_update_proc);
    Data *data = layer_get_data(this);

    prv_battery_state_handler(battery_state_service_peek(), this);
    data->battery_state_event_handle = events_battery_state_service_subscribe_context(prv_battery_state_handler, this);

    return this;
}

void battery_layer_destroy(BatteryLayer *this) {
    logf();
    Data *data = layer_get_data(this);
    events_battery_state_service_unsubscribe(data->battery_state_event_handle);
    layer_destroy(this);
}