import { createServer } from "node:http";
import { createPubSub, createSchema, createYoga } from "graphql-yoga";

import { nanoid } from "nanoid";
// import data
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { events, locations, users, participants } = require("./data.json");

const pubSub = createPubSub();

const typeDefs = `#graphql
  # Event
  type Event {
    id: ID!
    title: String
    desc: String
    date: String
    from: String
    to: String
    location_id: ID!
    location: Location
    user_id: ID!
    user: User
    participants: [Participant]
  }
  input CreateEventInput {
    title: String!
    desc: String!
    date: String!
    from: String!
    to: String!
    location_id: ID!
    user_id: ID!
  }
  input UpdateEventInput {
    title: String
    desc: String
    date: String
    from: String
    to: String
    location_id: ID
    user_id: ID
  }

  # Location
  type Location{
    id: ID!
    name: String
    desc: String
    lat: Float
    lng: Float
  }
  input CreateLocationInput {
    name: String!
    desc: String!
    lat: Float!
    lng: Float!
  }
  input UpdateLocationInput {
    name: String
    desc: String
    lat: Float
    lng: Float
  }

  # User
  type User {
    id: ID!
    username: String!
    email: String!
    events: [Event]
    attended_events: [Event]
  }
  input CreateUserInput {
    username: String!
    email: String!
  }
  input UpdateUserInput {
    username: String
    email: String
  }

  # Participant
  type Participant {
    id: ID!
    user_id: ID!
    user: User
    event_id: ID!
    event: Event
  }
  input CreateParticipantInput {
    user_id: ID!
    event_id: ID!
  }
  input UpdateParticipantInput {
    user_id: ID
    event_id: ID
  }

  type DeleteAllOutput {
    count: Int!
  }

  type Query {
    events: [Event]
    event(id: ID!): Event

    locations: [Location]
    location(id: ID!): Location

    users: [User]
    user(id: ID!): User

    participants: [Participant]
    participant(id: ID!): Participant
  }

  type Mutation {
    # Event
    createEvent(data: CreateEventInput!): Event!
    updateEvent(id: ID!, data: UpdateEventInput): Event!
    deleteEvent(id: ID!): Event!
    deleteAllEvents: DeleteAllOutput!
    # User
    createUser(data: CreateUserInput!): User!
    updateUser(id: ID!, data: UpdateUserInput): User!
    deleteUser(id: ID!): User!
    deleteAllUsers: DeleteAllOutput!
    # Location
    createLocation(data: CreateLocationInput!): Location!
    updateLocation(id: ID!, data: UpdateLocationInput): Location!
    deleteLocation(id: ID!): Location!
    deleteAllLocations: DeleteAllOutput
    # Participant
    createParticipant(data: CreateParticipantInput!): Participant!
    updateParticipant(id: ID!, data: UpdateParticipantInput): Participant!
    deleteParticipant(id: ID!): Participant!
    deleteAllParticipants: DeleteAllOutput
  }

  type Subscription {
    # Event
    eventCreated: Event!
    # User
    userCreated: User!
    # Participant
    participantCreated: Participant!
  }
`;

const resolvers = {
  Subscription: {
    // Event
    eventCreated: {
      subscribe: () => {
        return pubSub.subscribe("eventCreated");
      },
      resolve: (payload) => payload,
    },
    // User
    userCreated: {
      subscribe: () => {
        return pubSub.subscribe("userCreated");
      },
      resolve: (payload) => payload,
    },
    // Participant
    participantCreated: {
      subscribe: () => {
        return pubSub.subscribe("participantCreated");
      },
      resolve: (payload) => payload,
    },
  },
  Mutation: {
    // Event
    createEvent: (_, { data }) => {
      const event = { id: nanoid(), ...data };
      events.push(event);
      pubSub.publish("eventCreated", event);
      return event;
    },
    updateEvent: (_, { id, data }) => {
      const event_index = events.findIndex(
        (event) => event.id.toString() === id
      );
      if (event_index === -1) {
        throw new Error("Event not found.");
      }
      const updated_event = (events[event_index] = {
        ...events[event_index],
        ...data,
      });
      return updated_event;
    },
    deleteEvent: (_, { id }) => {
      const event_index = events.findIndex(
        (event) => event.id.toString() === id
      );
      if (event_index === -1) {
        throw new Error("Event not found.");
      }
      const deleted_event = events[event_index];
      events.splice(event_index, 1);
      return deleted_event;
    },
    deleteAllEvents: () => {
      const length = events.length;
      events.splice(0, length);
      return { count: length };
    },
    // User
    createUser: (_, { data }) => {
      const user = { id: nanoid(), ...data };
      users.push(user);
      pubSub.publish("userCreated", user);
      return user;
    },
    updateUser: (_, { id, data }) => {
      const user_index = users.findIndex((user) => user.id.toString() === id);
      if (user_index === -1) {
        throw new Error("User not found.");
      }
      const updated_user = (users[user_index] = {
        ...users[user_index],
        ...data,
      });
      return updated_user;
    },
    deleteUser: (_, { id }) => {
      const user_index = users.findIndex((user) => user.id.toString() === id);
      if (user_index === -1) {
        throw new Error("User not found.");
      }
      const deleted_user = users[user_index];
      users.splice(user_index, 1);
      return deleted_user;
    },
    deleteAllUsers: () => {
      const length = users.length;
      users.splice(0, length);
      return { count: length };
    },
    // Location
    createLocation: (_, { data }) => {
      const location = { id: nanoid(), ...data };
      locations.push(location);
      return location;
    },
    updateLocation: (_, { id, data }) => {
      const location_index = locations.findIndex(
        (location) => location.id.toString() === id
      );
      if (location_index === -1) {
        throw new Error("Location not found.");
      }
      const updated_location = (locations[location_index] = {
        ...locations[location_index],
        ...data,
      });
      return updated_location;
    },
    deleteLocation: (_, { id }) => {
      const location_index = locations.findIndex(
        (location) => location.id.toString() === id
      );
      if (location_index === -1) {
        throw new Error("Location not found.");
      }
      const deleted_location = locations[location_index];
      locations.splice(location_index, 1);
      return deleted_location;
    },
    deleteAllLocations: () => {
      const length = locations.length;
      locations.splice(0, length);
      return { count: length };
    },
    // Participant
    createParticipant: (_, { data }) => {
      const participant = { id: nanoid(), ...data };
      participants.push(participant);
      pubSub.publish("participantCreated", participant);
      return participant;
    },
    updateParticipant: (_, { id, data }) => {
      const participant_index = participants.findIndex(
        (participant) => participant.id.toString() === id
      );
      if (participant_index === -1) {
        throw new Error("Participant not found.");
      }
      const updated_participant = (participants[participant_index] = {
        ...participants[participant_index],
        ...data,
      });
      return updated_participant;
    },
    deleteParticipant: (_, { id }) => {
      const participant_index = participants.findIndex(
        (participant) => participant.id.toString() === id
      );
      if (participant_index === -1) {
        throw new Error("Participant not found.");
      }
      const deleted_participant = participants[participant_index];
      participants.splice(participant_index, 1);
      return deleted_participant;
    },
    deleteAllParticipants: () => {
      const length = participants.length;
      participants.splice(0, length);
      return { count: length };
    },
  },
  Query: {
    // Event
    events: () => events,
    event: (_, args) => {
      const result = events.find((event) => event.id.toString() === args.id);
      if (!result) {
        throw new Error("Event not found");
      }
      return result;
    },
    //Location
    locations: () => locations,
    location: (_, args) => {
      const result = locations.find(
        (location) => location.id.toString() === args.id
      );
      if (!result) {
        throw new Error("Location not found");
      }
      return result;
    },
    // User
    users: () => users,
    user: (_, args) => {
      const result = users.find((user) => user.id.toString() === args.id);
      if (!result) {
        throw new Error("User not found");
      }
      return result;
    },
    // Participant
    participants: () => participants,
    participant: (_, args) => {
      const result = participants.find(
        (participant) => participant.id.toString() === args.id
      );
      if (!result) {
        throw new Error("Participant not found");
      }
      return result;
    },
  },
  Event: {
    location: (parent) => {
      const result = locations.find(
        (location) => location.id.toString() === parent.location_id.toString()
      );
      return result;
    },
    user: (parent) => {
      const result = users.find(
        (user) => user.id.toString() === parent.user_id.toString()
      );
      return result;
    },
    participants: (parent) => {
      const result = participants.filter(
        (participant) =>
          participant.event_id.toString() === parent.id.toString()
      );
      return result;
    },
  },
  User: {
    events: (parent) => {
      const result = events.filter(
        (event) => event.user_id.toString() === parent.id.toString()
      );
      return result;
    },
    attended_events: (parent) => {
      const attended_events = participants.filter(
        (participant) => participant.user_id.toString() === parent.id.toString()
      );
      let arr = [];
      attended_events.forEach((item) => {
        const result = events.find(
          (event) => event.id.toString() === item.event_id.toString()
        );
        if (result) {
          arr.push(result);
        }
      });
      return arr;
    },
  },
  Participant: {
    user: (parent) => {
      const result = users.find(
        (user) => user.id.toString() === parent.user_id.toString()
      );
      return result;
    },
    event: (parent) => {
      const result = events.find(
        (event) => event.id.toString() === parent.event_id.toString()
      );
      return result;
    },
  },
};

// Provide your schema
const yoga = createYoga({
  graphqlEndpoint: "/",
  schema: createSchema({
    typeDefs,
    resolvers,
  }),
});

const server = createServer(yoga);
server.listen(4000, () => {
  console.info("Server is running on http://localhost:4000");
});
