import AdminJS from "adminjs";
import * as AdminJSMongoose from "@adminjs/mongoose";
import AdminJSExpress from "@adminjs/express";
// import MongoStore from "connect-mongo";

import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";
import { Order } from "../models/order.model.js";
// import bcrypt from "bcrypt";

AdminJS.registerAdapter({
  Resource: AdminJSMongoose.Resource,
  Database: AdminJSMongoose.Database,
});

// const authenticate = async (email, password) => {
//   const user = await User.findOne({ email }).select("+password");
//   if (!user) return null;

//   const isMatch = await bcrypt.compare(password, user.password);
//   if (!isMatch) return null;

//   // Regenerate session ID to prevent session fixation
//   return {
//     id: user._id.toString(),
//     email: user.email,
//     role: user.role,
//     title: user.username,
//   };
// };

// const isAdmin = (user) => user?.role === "admin";

export const buildAdminRouter = () => {
  const admin = new AdminJS({
    resources: [
      {
        resource: User,
        options: {
          // actions: {
          //   list: { isAccessible: ({ currentAdmin }) => isAdmin(currentAdmin) },
          //   show: { isAccessible: ({ currentAdmin }) => isAdmin(currentAdmin) },
          //   edit: { isAccessible: ({ currentAdmin }) => isAdmin(currentAdmin) },
          //   delete: {
          //     isAccessible: ({ currentAdmin }) => isAdmin(currentAdmin),
          //   },
          //   new: { isAccessible: ({ currentAdmin }) => isAdmin(currentAdmin) },
          // },
          properties: {
            password: { isVisible: false },
            refreshToken: { isVisible: false },
          },
          navigation: { icon: "User" },
        },
      },
      {
        resource: Product,
        options: {
          navigation: { icon: "Gift" },
          // actions: {
          //   list: { isAccessible: ({ currentAdmin }) => isAdmin(currentAdmin) },
          //   show: { isAccessible: ({ currentAdmin }) => isAdmin(currentAdmin) },
          //   edit: { isAccessible: ({ currentAdmin }) => isAdmin(currentAdmin) },
          //   delete: {
          //     isAccessible: ({ currentAdmin }) => isAdmin(currentAdmin),
          //   },
          //   new: { isAccessible: ({ currentAdmin }) => isAdmin(currentAdmin) },
          //   toggleAvailability: {
          //     actionType: "record",
          //     isVisible: true,
          //     isAccessible: ({ currentAdmin }) => isAdmin(currentAdmin),
          //     handler: async (request, response, context) => {
          //       const { record } = context;
          //       const currentStatus = record.param("isAvailable");
          //       await record.update({ isAvailable: !currentStatus });
          //       return {
          //         record: record.toJSON(),
          //         notice: {
          //           message: `Product availability toggled to ${!currentStatus ? "available" : "unavailable"}.`,
          //           type: "success",
          //         },
          //       };
          //     },
          //     component: false,
          //   },
          // },
          properties: {
            "images.url": { type: "href", label: "Image URL" },
          },
        },
      },
      {
        resource: Order,
        options: {
          actions: {
            // list: { isAccessible: ({ currentAdmin }) => isAdmin(currentAdmin) },
            // show: { isAccessible: ({ currentAdmin }) => isAdmin(currentAdmin) },
            // edit: { isAccessible: false },
            delete: { isAccessible: false },
          },
          navigation: { icon: "Truck" },
          properties: {
            "orderItems.product": { reference: "Product" },
          },
        },
      },
    ],
    rootPath: "/admin",
    branding: {
      companyName: "ShopBlizz Admin",
      logo: null,
    },
    locale: {
      translations: {
        resources: {
          User: {
            messages: {
              noRecordsInResource: "There are no users to display",
            },
          },
          Product: {
            messages: {
              noRecordsInResource: "There are no products to display",
            },
          },
          Order: {
            messages: {
              noRecordsInResource: "There are no orders to display",
            },
          },
        },
        labels: { User: "Users", Product: "Products", Order: "Orders" },
        messages: { loginWelcome: "Welcome to ShopBlizz Admin" },
      },
    },
  });

  // const cookieSecret = process.env.ADMIN_COOKIE_PASSWORD;
  // if (!cookieSecret || cookieSecret.length < 32) {
  //   throw new Error("ADMIN_COOKIE_PASSWORD must be at least 32 characters!");
  // }

  // const sessionStore = MongoStore.create({
  //   mongoUrl: process.env.DATABASE_URL,
  //   collectionName: "adminjs_sessions",
  //   ttl: 24 * 60 * 60,
  //   autoRemove: "native",
  // });

  // const adminRouter = AdminJSExpress.buildAuthenticatedRouter(
  //   admin,
  //   {
  //     authenticate,
  //     cookieName: "adminjs-auth",
  //     cookiePassword: cookieSecret,
  //   },
  //   null,
  //   {
  //     store: sessionStore,
  //     secret: cookieSecret,
  //     resave: false,
  //     saveUninitialized: false,
  //     name: "adminjs-auth",
  //     cookie: {
  //       httpOnly: true,
  //       secure: process.env.NODE_ENV === "production",
  //       maxAge: 24 * 60 * 60 * 1000,
  //     },
  //   }
  // );

  const adminRouter = AdminJSExpress.buildRouter(admin);

  return { admin, adminRouter };
};
