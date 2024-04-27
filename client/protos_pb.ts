// source: protos.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {missingRequire} reports error on implicit type usages.
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck

import jspb, { Message, BinaryReader, BinaryWriter } from "google-protobuf";
var goog = jspb;
var global =
  (typeof globalThis !== "undefined" && globalThis) ||
  (typeof window !== "undefined" && window) ||
  (typeof global !== "undefined" && global) ||
  (typeof self !== "undefined" && self) ||
  function () {
    return this;
  }.call(null) ||
  Function("return this")();

goog.exportSymbol("proto.Duck", null, global);
goog.exportSymbol("proto.UpdateSync", null, global);
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.Duck = function (opt_data) {
  Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.Duck, Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.Duck.displayName = "proto.Duck";
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.UpdateSync = function (opt_data) {
  Message.initialize(
    this,
    opt_data,
    0,
    -1,
    proto.UpdateSync.repeatedFields_,
    null,
  );
};
goog.inherits(proto.UpdateSync, Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.UpdateSync.displayName = "proto.UpdateSync";
}

if (Message.GENERATE_TO_OBJECT) {
  /**
   * Creates an object representation of this proto.
   * Field names that are reserved in JavaScript and will be renamed to pb_name.
   * Optional fields that are not set will be set to undefined.
   * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
   * For the list of reserved names please see:
   *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
   * @param {boolean=} opt_includeInstance Deprecated. whether to include the
   *     JSPB instance for transitional soy proto support:
   *     http://goto/soy-param-migration
   * @return {!Object}
   */
  proto.Duck.prototype.toObject = function (opt_includeInstance) {
    return proto.Duck.toObject(opt_includeInstance, this);
  };

  /**
   * Static version of the {@see toObject} method.
   * @param {boolean|undefined} includeInstance Deprecated. Whether to include
   *     the JSPB instance for transitional soy proto support:
   *     http://goto/soy-param-migration
   * @param {!proto.Duck} msg The msg instance to transform.
   * @return {!Object}
   * @suppress {unusedLocalVariables} f is only used for nested messages
   */
  proto.Duck.toObject = function (includeInstance, msg) {
    var f,
      obj = {
        id: Message.getFieldWithDefault(msg, 1, 0),
        rotation: Message.getFloatingPointFieldWithDefault(msg, 2, 0.0),
        x: Message.getFloatingPointFieldWithDefault(msg, 3, 0.0),
        y: Message.getFloatingPointFieldWithDefault(msg, 4, 0.0),
        z: Message.getFloatingPointFieldWithDefault(msg, 5, 0.0),
        score: Message.getFieldWithDefault(msg, 6, 0),
      };

    if (includeInstance) {
      obj.$jspbMessageInstance = msg;
    }
    return obj;
  };
}

/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.Duck}
 */
proto.Duck.deserializeBinary = function (bytes) {
  var reader = new BinaryReader(bytes);
  var msg = new proto.Duck();
  return proto.Duck.deserializeBinaryFromReader(msg, reader);
};

/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.Duck} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.Duck}
 */
proto.Duck.deserializeBinaryFromReader = function (msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
      case 1:
        var value = /** @type {number} */ reader.readUint32();
        msg.setId(value);
        break;
      case 2:
        var value = /** @type {number} */ reader.readFloat();
        msg.setRotation(value);
        break;
      case 3:
        var value = /** @type {number} */ reader.readFloat();
        msg.setX(value);
        break;
      case 4:
        var value = /** @type {number} */ reader.readFloat();
        msg.setY(value);
        break;
      case 5:
        var value = /** @type {number} */ reader.readFloat();
        msg.setZ(value);
        break;
      case 6:
        var value = /** @type {number} */ reader.readUint32();
        msg.setScore(value);
        break;
      default:
        reader.skipField();
        break;
    }
  }
  return msg;
};

/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.Duck.prototype.serializeBinary = function () {
  var writer = new BinaryWriter();
  proto.Duck.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};

/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.Duck} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.Duck.serializeBinaryToWriter = function (message, writer) {
  var f = undefined;
  f = message.getId();
  if (f !== 0) {
    writer.writeUint32(1, f);
  }
  f = message.getRotation();
  if (f !== 0.0) {
    writer.writeFloat(2, f);
  }
  f = message.getX();
  if (f !== 0.0) {
    writer.writeFloat(3, f);
  }
  f = message.getY();
  if (f !== 0.0) {
    writer.writeFloat(4, f);
  }
  f = message.getZ();
  if (f !== 0.0) {
    writer.writeFloat(5, f);
  }
  f = message.getScore();
  if (f !== 0) {
    writer.writeUint32(6, f);
  }
};

/**
 * optional uint32 id = 1;
 * @return {number}
 */
proto.Duck.prototype.getId = function () {
  return /** @type {number} */ Message.getFieldWithDefault(this, 1, 0);
};

/**
 * @param {number} value
 * @return {!proto.Duck} returns this
 */
proto.Duck.prototype.setId = function (value) {
  return Message.setProto3IntField(this, 1, value);
};

/**
 * optional float rotation = 2;
 * @return {number}
 */
proto.Duck.prototype.getRotation = function () {
  return /** @type {number} */ Message.getFloatingPointFieldWithDefault(
    this,
    2,
    0.0,
  );
};

/**
 * @param {number} value
 * @return {!proto.Duck} returns this
 */
proto.Duck.prototype.setRotation = function (value) {
  return Message.setProto3FloatField(this, 2, value);
};

/**
 * optional float x = 3;
 * @return {number}
 */
proto.Duck.prototype.getX = function () {
  return /** @type {number} */ Message.getFloatingPointFieldWithDefault(
    this,
    3,
    0.0,
  );
};

/**
 * @param {number} value
 * @return {!proto.Duck} returns this
 */
proto.Duck.prototype.setX = function (value) {
  return Message.setProto3FloatField(this, 3, value);
};

/**
 * optional float y = 4;
 * @return {number}
 */
proto.Duck.prototype.getY = function () {
  return /** @type {number} */ Message.getFloatingPointFieldWithDefault(
    this,
    4,
    0.0,
  );
};

/**
 * @param {number} value
 * @return {!proto.Duck} returns this
 */
proto.Duck.prototype.setY = function (value) {
  return Message.setProto3FloatField(this, 4, value);
};

/**
 * optional float z = 5;
 * @return {number}
 */
proto.Duck.prototype.getZ = function () {
  return /** @type {number} */ Message.getFloatingPointFieldWithDefault(
    this,
    5,
    0.0,
  );
};

/**
 * @param {number} value
 * @return {!proto.Duck} returns this
 */
proto.Duck.prototype.setZ = function (value) {
  return Message.setProto3FloatField(this, 5, value);
};

/**
 * optional uint32 score = 6;
 * @return {number}
 */
proto.Duck.prototype.getScore = function () {
  return /** @type {number} */ Message.getFieldWithDefault(this, 6, 0);
};

/**
 * @param {number} value
 * @return {!proto.Duck} returns this
 */
proto.Duck.prototype.setScore = function (value) {
  return Message.setProto3IntField(this, 6, value);
};

/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.UpdateSync.repeatedFields_ = [1];

if (Message.GENERATE_TO_OBJECT) {
  /**
   * Creates an object representation of this proto.
   * Field names that are reserved in JavaScript and will be renamed to pb_name.
   * Optional fields that are not set will be set to undefined.
   * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
   * For the list of reserved names please see:
   *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
   * @param {boolean=} opt_includeInstance Deprecated. whether to include the
   *     JSPB instance for transitional soy proto support:
   *     http://goto/soy-param-migration
   * @return {!Object}
   */
  proto.UpdateSync.prototype.toObject = function (opt_includeInstance) {
    return proto.UpdateSync.toObject(opt_includeInstance, this);
  };

  /**
   * Static version of the {@see toObject} method.
   * @param {boolean|undefined} includeInstance Deprecated. Whether to include
   *     the JSPB instance for transitional soy proto support:
   *     http://goto/soy-param-migration
   * @param {!proto.UpdateSync} msg The msg instance to transform.
   * @return {!Object}
   * @suppress {unusedLocalVariables} f is only used for nested messages
   */
  proto.UpdateSync.toObject = function (includeInstance, msg) {
    var f,
      obj = {
        ducksList: Message.toObjectList(
          msg.getDucksList(),
          proto.Duck.toObject,
          includeInstance,
        ),
        breadX: Message.getFloatingPointFieldWithDefault(msg, 2, 0.0),
        breadY: Message.getFloatingPointFieldWithDefault(msg, 3, 0.0),
        breadZ: Message.getFloatingPointFieldWithDefault(msg, 4, 0.0),
      };

    if (includeInstance) {
      obj.$jspbMessageInstance = msg;
    }
    return obj;
  };
}

/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.UpdateSync}
 */
proto.UpdateSync.deserializeBinary = function (bytes) {
  var reader = new BinaryReader(bytes);
  var msg = new proto.UpdateSync();
  return proto.UpdateSync.deserializeBinaryFromReader(msg, reader);
};

/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.UpdateSync} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.UpdateSync}
 */
proto.UpdateSync.deserializeBinaryFromReader = function (msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
      case 1:
        var value = new proto.Duck();
        reader.readMessage(value, proto.Duck.deserializeBinaryFromReader);
        msg.addDucks(value);
        break;
      case 2:
        var value = /** @type {number} */ reader.readFloat();
        msg.setBreadX(value);
        break;
      case 3:
        var value = /** @type {number} */ reader.readFloat();
        msg.setBreadY(value);
        break;
      case 4:
        var value = /** @type {number} */ reader.readFloat();
        msg.setBreadZ(value);
        break;
      default:
        reader.skipField();
        break;
    }
  }
  return msg;
};

/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.UpdateSync.prototype.serializeBinary = function () {
  var writer = new BinaryWriter();
  proto.UpdateSync.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};

/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.UpdateSync} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.UpdateSync.serializeBinaryToWriter = function (message, writer) {
  var f = undefined;
  f = message.getDucksList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(1, f, proto.Duck.serializeBinaryToWriter);
  }
  f = /** @type {number} */ Message.getField(message, 2);
  if (f != null) {
    writer.writeFloat(2, f);
  }
  f = /** @type {number} */ Message.getField(message, 3);
  if (f != null) {
    writer.writeFloat(3, f);
  }
  f = /** @type {number} */ Message.getField(message, 4);
  if (f != null) {
    writer.writeFloat(4, f);
  }
};

/**
 * repeated Duck ducks = 1;
 * @return {!Array<!proto.Duck>}
 */
proto.UpdateSync.prototype.getDucksList = function () {
  return /** @type{!Array<!proto.Duck>} */ Message.getRepeatedWrapperField(
    this,
    proto.Duck,
    1,
  );
};

/**
 * @param {!Array<!proto.Duck>} value
 * @return {!proto.UpdateSync} returns this
 */
proto.UpdateSync.prototype.setDucksList = function (value) {
  return Message.setRepeatedWrapperField(this, 1, value);
};

/**
 * @param {!proto.Duck=} opt_value
 * @param {number=} opt_index
 * @return {!proto.Duck}
 */
proto.UpdateSync.prototype.addDucks = function (opt_value, opt_index) {
  return Message.addToRepeatedWrapperField(
    this,
    1,
    opt_value,
    proto.Duck,
    opt_index,
  );
};

/**
 * Clears the list making it empty but non-null.
 * @return {!proto.UpdateSync} returns this
 */
proto.UpdateSync.prototype.clearDucksList = function () {
  return this.setDucksList([]);
};

/**
 * optional float bread_x = 2;
 * @return {number}
 */
proto.UpdateSync.prototype.getBreadX = function () {
  return /** @type {number} */ Message.getFloatingPointFieldWithDefault(
    this,
    2,
    0.0,
  );
};

/**
 * @param {number} value
 * @return {!proto.UpdateSync} returns this
 */
proto.UpdateSync.prototype.setBreadX = function (value) {
  return Message.setField(this, 2, value);
};

/**
 * Clears the field making it undefined.
 * @return {!proto.UpdateSync} returns this
 */
proto.UpdateSync.prototype.clearBreadX = function () {
  return Message.setField(this, 2, undefined);
};

/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.UpdateSync.prototype.hasBreadX = function () {
  return Message.getField(this, 2) != null;
};

/**
 * optional float bread_y = 3;
 * @return {number}
 */
proto.UpdateSync.prototype.getBreadY = function () {
  return /** @type {number} */ Message.getFloatingPointFieldWithDefault(
    this,
    3,
    0.0,
  );
};

/**
 * @param {number} value
 * @return {!proto.UpdateSync} returns this
 */
proto.UpdateSync.prototype.setBreadY = function (value) {
  return Message.setField(this, 3, value);
};

/**
 * Clears the field making it undefined.
 * @return {!proto.UpdateSync} returns this
 */
proto.UpdateSync.prototype.clearBreadY = function () {
  return Message.setField(this, 3, undefined);
};

/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.UpdateSync.prototype.hasBreadY = function () {
  return Message.getField(this, 3) != null;
};

/**
 * optional float bread_z = 4;
 * @return {number}
 */
proto.UpdateSync.prototype.getBreadZ = function () {
  return /** @type {number} */ Message.getFloatingPointFieldWithDefault(
    this,
    4,
    0.0,
  );
};

/**
 * @param {number} value
 * @return {!proto.UpdateSync} returns this
 */
proto.UpdateSync.prototype.setBreadZ = function (value) {
  return Message.setField(this, 4, value);
};

/**
 * Clears the field making it undefined.
 * @return {!proto.UpdateSync} returns this
 */
proto.UpdateSync.prototype.clearBreadZ = function () {
  return Message.setField(this, 4, undefined);
};

/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.UpdateSync.prototype.hasBreadZ = function () {
  return Message.getField(this, 4) != null;
};

// goog.object.extend(exports, proto);
export default proto;
