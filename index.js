import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
// import data
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { events, locations, users, participants } = require("./data.json");

const typeDefs = `#graphql
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
  type Location{
    id: ID!
    name: String
    desc: String
    lat: Float
    lng: Float
  }
  type User {
    id: ID!
    username: String!
    email: String!
    events: [Event]
    attended_events: [Event]
  }
  type Participant {
    id : ID!
    user_id: ID!
    user: User
    event_id: ID!
    event: Event
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
`;

const resolvers = {
  Query: {
    // Event
    events: () => events,
    event: (_, args) => {
      const result = events.find((event) => event.id === Number(args.id));
      if (!result) {
        return new Error("Event not found");
      }
      return result;
    },
    //Location
    locations: () => locations,
    location: (_, args) => {
      const result = locations.find(
        (location) => location.id === Number(args.id)
      );
      return result;
    },
    // User
    users: () => users,
    user: (_, args) => {
      const result = users.find((user) => user.id === Number(args.id));
      return result;
    },
    // Participant
    participants: () => participants,
    participant: (_, args) => {
      const result = participants.find(
        (participant) => participant.id === Number(args.id)
      );
      return result;
    },
  },
  Event: {
    location: (parent) => {
      const result = locations.find(
        (location) => location.id === parent.location_id
      );
      return result;
    },
    user: (parent) => {
      const result = users.find((user) => user.id === parent.user_id);
      return result;
    },
    participants: (parent) => {
      const result = participants.filter(
        (participant) => participant.event_id === parent.id
      );
      return result;
    },
  },
  User: {
    events: (parent) => {
      const result = events.filter((event) => event.user_id === parent.id);
      return result;
    },
    attended_events: (parent) => {
      const attended_events = participants.filter(
        (participant) => participant.user_id === parent.id
      );
      let arr = [];
      attended_events.forEach((item) => {
        const result = events.find((event) => event.id === item.event_id);
        if (result) {
          arr.push(result);
        }
      });
      return arr;
    },
  },
  Participant: {
    user: (parent) => {
      const result = users.find((user) => user.id === parent.user_id);
      return result;
    },
    event: (parent) => {
      const result = events.find((event) => event.id === parent.event_id);
      return result;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀 Server ready at: ${url}`);
